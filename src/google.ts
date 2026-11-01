import type { Env, Account, Property, SearchResponse, SearchRow, Site } from './types';
import { HttpError } from './types';
import { decryptToken } from './security';

const GOOGLE = 'https://www.googleapis.com';
const CACHE_HOURS = 3;

export function dayISO(date: Date): string { return date.toISOString().slice(0, 10); }
export function relativeDay(days: number): string {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return dayISO(d);
}

export function range(days: number): { start: string; end: string; previousStart: string } {
  // GSC normally finalizes data after a 2-3 day delay.
  return { start: relativeDay(-days - 2), end: relativeDay(-3), previousStart: relativeDay(-2 * days - 2) };
}

export async function cached<T>(env: Env, key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
  const row = await env.DB.prepare('SELECT payload FROM cache WHERE cache_key = ? AND expires_at > ?')
    .bind(key, Date.now()).first<{ payload: string }>();
  if (row) return JSON.parse(row.payload) as T;
  const value = await fetcher();
  await env.DB.prepare('INSERT INTO cache (cache_key,payload,expires_at) VALUES (?,?,?) ON CONFLICT(cache_key) DO UPDATE SET payload=excluded.payload,expires_at=excluded.expires_at')
    .bind(key, JSON.stringify(value), Date.now() + ttlSeconds * 1000).run();
  return value;
}

export async function getAccount(env: Env, email: string): Promise<Account> {
  const account = await env.DB.prepare('SELECT email, google_sub, refresh_cipher FROM accounts WHERE email = ?').bind(email).first<Account>();
  if (!account) throw new HttpError(401, 'Google account not connected');
  return account;
}

export async function getAccessToken(env: Env, email: string): Promise<string> {
  const account = await getAccount(env, email);
  const refresh = await decryptToken(account.refresh_cipher, env);
  const form = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET,
    refresh_token: refresh, grant_type: 'refresh_token'
  });
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: form });
  const data = await response.json() as { access_token?: string; error?: string };
  if (!response.ok || !data.access_token) throw new HttpError(502, 'Google token refresh failed: ' + (data.error || response.status));
  return data.access_token;
}

export async function googleRequest<T>(token: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(GOOGLE + path, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: 'Bearer ' + token, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  if (!response.ok) {
    let info = 'Google API HTTP ' + response.status;
    try {
      const data = await response.json() as { error?: { message?: string } };
      if (data.error?.message) info = data.error.message;
    } catch { /* retain status */ }
    throw new HttpError(response.status === 429 ? 429 : 502, info);
  }
  return response.json() as Promise<T>;
}

function groupProperties(properties: Property[]): Site[] {
  const domains = properties.filter(p => p.siteUrl.startsWith('sc-domain:'))
    .map(p => p.siteUrl.slice(10).toLowerCase()).sort((a, b) => b.length - a.length);
  const grouped = new Map<string, Property[]>();
  for (const prop of properties) {
    const raw = prop.siteUrl;
    let host = '';
    if (raw.startsWith('sc-domain:')) host = raw.slice(10).toLowerCase();
    else {
      try { host = new URL(raw).hostname.toLowerCase().replace(/^www\./, ''); }
      catch { continue; }
    }
    const matchingDomain = domains.find(d => host === d || host.endsWith('.' + d));
    const key = matchingDomain || host;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(prop);
  }
  return [...grouped.entries()].map(([id, options]) => {
    const sorted = [...options].sort((a, b) => {
      const score = (p: Property) => {
        if (p.siteUrl === 'sc-domain:' + id) return 10000;
        try {
          const url = new URL(p.siteUrl);
          const root = url.pathname === '/' ? 100 : 0;
          return root + (url.protocol === 'https:' ? 10 : 0) - url.pathname.length;
        } catch { return 0; }
      };
      return score(b) - score(a);
    });
    return {
      id, label: id, property: sorted[0].siteUrl,
      variants: sorted.map(p => p.siteUrl), permission: sorted[0].permissionLevel
    };
  }).sort((a, b) => a.label.localeCompare(b.label));
}

export async function listSites(env: Env, email: string, token: string, force = false): Promise<Site[]> {
  const key = 'sites:' + email;
  const load = async () => {
    const result = await googleRequest<{ siteEntry?: Property[] }>(token, '/webmasters/v3/sites');
    return groupProperties((result.siteEntry || []).filter(p => p.permissionLevel !== 'siteUnverifiedUser'));
  };
  if (force) {
    const sites = await load();
    await env.DB.prepare('DELETE FROM cache WHERE cache_key LIKE ?').bind('sites:' + email).run();
    await cached(env, key, 6 * 3600, async () => sites);
    return sites;
  }
  return cached(env, key, 6 * 3600, load);
}

export function findSite(sites: Site[], property: string): Site {
  const site = sites.find(s => s.property === property);
  if (!site) throw new HttpError(403, 'Unknown or unauthorized Search Console property');
  return site;
}

export async function analytics(token: string, property: string, options: {
  startDate: string; endDate: string; dimensions?: string[]; rowLimit?: number;
}): Promise<SearchRow[]> {
  const data = await googleRequest<SearchResponse>(
    token, '/webmasters/v3/sites/' + encodeURIComponent(property) + '/searchAnalytics/query',
    { startDate: options.startDate, endDate: options.endDate,
      dimensions: options.dimensions || [], rowLimit: options.rowLimit || 250,
      type: 'web', dataState: 'final' }
  );
  return data.rows || [];
}

type Totals = { clicks: number; impressions: number; ctr: number; position: number };
type Day = Totals & { date: string };
function totals(rows: SearchRow[]): Totals {
  let clicks = 0, impressions = 0, positionSum = 0;
  for (const row of rows) {
    clicks += row.clicks || 0;
    impressions += row.impressions || 0;
    positionSum += (row.position || 0) * (row.impressions || 0);
  }
  return { clicks, impressions, ctr: impressions ? clicks / impressions : 0,
    position: impressions ? positionSum / impressions : 0 };
}
export function reduceMetrics(days: number, rows: SearchRow[]) {
  const r = range(days);
  const recent = rows.filter(x => (x.keys?.[0] || '') >= r.start);
  const prior = rows.filter(x => (x.keys?.[0] || '') < r.start);
  const timeline: Day[] = recent.map(x => ({ date: x.keys?.[0] || '', ...totals([x]) }));
  return { current: totals(recent), previous: totals(prior), timeline };
}

export async function overview(env: Env, email: string, token: string, days: number) {
  const sites = await listSites(env, email, token);
  const r = range(days);
  const results: Array<{ site: Site; current?: Totals; previous?: Totals; timeline?: Day[]; error?: string }> = [];
  // Controlled concurrency prevents quota spikes with larger GSC accounts.
  for (let i = 0; i < sites.length; i += 4) {
    const batch = await Promise.all(sites.slice(i, i + 4).map(async site => {
      try {
        const metrics = await cached(env, ['metrics', email, site.property, days, r.end].join(':'), CACHE_HOURS * 3600,
          async () => reduceMetrics(days, await analytics(token, site.property,
            { startDate: r.previousStart, endDate: r.end, dimensions: ['date'], rowLimit: 200 })));
        return { site, ...metrics };
      } catch (error) { return { site, error: error instanceof Error ? error.message : 'Unable to load' }; }
    }));
    results.push(...batch);
  }
  const success = results.filter(x => x.current && x.previous);
  const sum = (key: 'current' | 'previous'): Totals => {
    const entries = success.map(x => x[key]!).filter(Boolean);
    const clicks = entries.reduce((n, x) => n + x.clicks, 0);
    const impressions = entries.reduce((n, x) => n + x.impressions, 0);
    return { clicks, impressions, ctr: impressions ? clicks / impressions : 0,
      position: impressions ? entries.reduce((n, x) => n + x.position * x.impressions, 0) / impressions : 0 };
  };
  const combined = new Map<string, SearchRow[]>();
  for (const result of success) for (const date of result.timeline || []) {
    if (!combined.has(date.date)) combined.set(date.date, []);
    combined.get(date.date)!.push({ ...date, keys: [date.date] });
  }
  const timeline = [...combined.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, day]) => ({ date, ...totals(day) }));
  return { days, period: { start: r.start, end: r.end }, total: sum('current'),
    previous: sum('previous'), timeline, sites: results, partial: success.length !== sites.length,
    connected: sites.length, successful: success.length, updatedAt: new Date().toISOString() };
}

export async function detailRows(env: Env, email: string, token: string, property: string, dimension: 'query' | 'page', days: number) {
  findSite(await listSites(env, email, token), property);
  const r = range(days);
  return cached(env, ['detail', email, property, dimension, days, r.end].join(':'), CACHE_HOURS * 3600,
    () => analytics(token, property, { startDate: r.start, endDate: r.end, dimensions: [dimension], rowLimit: 250 }));
}

export async function inspection(env: Env, email: string, token: string, property: string, inspectionUrl: string) {
  findSite(await listSites(env, email, token), property);
  const url = new URL(inspectionUrl);
  if (!['http:', 'https:'].includes(url.protocol)) throw new HttpError(400, 'Only HTTP(S) URLs are allowed');
  const valid = property.startsWith('sc-domain:')
    ? (url.hostname === property.slice(10) || url.hostname.endsWith('.' + property.slice(10)))
    : url.href.startsWith(property);
  if (!valid) throw new HttpError(400, 'URL is not contained within selected property');
  return googleRequest<Record<string, unknown>>(token, '/v1/urlInspection/index:inspect', { inspectionUrl: url.href, siteUrl: property, languageCode: 'en-US' });
}
