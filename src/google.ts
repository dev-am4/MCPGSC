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
  const previousTimeline: Day[] = prior.map(x => ({ date: x.keys?.[0] || '', ...totals([x]) }));
  return { current: totals(recent), previous: totals(prior), timeline, previousTimeline };
}

export async function overview(env: Env, email: string, token: string, days: number) {
  const sites = await listSites(env, email, token);
  const r = range(days);
  const results: Array<{ site: Site; current?: Totals; previous?: Totals; timeline?: Day[]; previousTimeline?: Day[]; error?: string }> = [];
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
  const combinedPrior = new Map<string, SearchRow[]>();
  for (const result of success) for (const day of result.previousTimeline || []) {
    if (!combinedPrior.has(day.date)) combinedPrior.set(day.date, []);
    combinedPrior.get(day.date)!.push({ ...day, keys: [day.date] });
  }
  const previousTimeline = [...combinedPrior.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, day]) => ({ date, ...totals(day) }));
  return { days, period: { start: r.start, end: r.end, previousStart: r.previousStart,
      previousEnd: relativeDay(-days - 3) }, total: sum('current'),
    previous: sum('previous'), timeline, previousTimeline, sites: results, partial: success.length !== sites.length,
    connected: sites.length, successful: success.length, updatedAt: new Date().toISOString() };
}

export async function detailRows(env: Env, email: string, token: string, property: string, dimension: 'query' | 'page', days: number) {
  findSite(await listSites(env, email, token), property);
  const r = range(days);
  return cached(env, ['detail', email, property, dimension, days, r.end].join(':'), CACHE_HOURS * 3600,
    () => analytics(token, property, { startDate: r.start, endDate: r.end, dimensions: [dimension], rowLimit: 250 }));
}


export type SegmentDimension = 'device' | 'country' | 'searchAppearance';

/** Query only after a property is authorized; short caching keeps GSC quota under control. */
export async function segmentRows(env: Env, email: string, token: string,
  property: string, dimension: SegmentDimension, days: number) {
  findSite(await listSites(env, email, token), property);
  const r = range(days);
  return cached(env, ['segment-v1', email, property, dimension, days, r.end].join(':'),
    CACHE_HOURS * 3600,
    () => analytics(token, property, { startDate: r.start, endDate: r.end,
      dimensions: [dimension], rowLimit: dimension === 'country' ? 250 : 80 }));
}

export type SitemapEntry = { path: string; lastDownloaded?: string; lastSubmitted?: string;
  isPending?: boolean; isSitemapsIndex?: boolean; errors: number; warnings: number;
  contents: Array<{ type: string; submitted: number }> };

export async function sitemapRows(env: Env, email: string, token: string, property: string): Promise<SitemapEntry[]> {
  findSite(await listSites(env, email, token), property);
  return cached(env, ['sitemap-v1', email, property].join(':'), CACHE_HOURS * 3600, async () => {
    const response = await googleRequest<{ sitemap?: Array<Record<string, unknown>> }>(
      token, '/webmasters/v3/sites/' + encodeURIComponent(property) + '/sitemaps');
    return (response.sitemap || []).slice(0, 250).map((row): SitemapEntry => ({
      path: String(row.path || ''), lastDownloaded: String(row.lastDownloaded || '') || undefined,
      lastSubmitted: String(row.lastSubmitted || '') || undefined,
      isPending: Boolean(row.isPending), isSitemapsIndex: Boolean(row.isSitemapsIndex),
      errors: Math.max(0, Number(row.errors || 0)), warnings: Math.max(0, Number(row.warnings || 0)),
      contents: (Array.isArray(row.contents) ? row.contents : []).map((v: any) => ({
        type: String(v.type || ''), submitted: Math.max(0, Number(v.submitted || 0))
      }))
    }));
  });
}

type StrategyMetric = Totals & { key: string; deltaClicks: number; deltaImpressions: number; previousClicks: number; previousImpressions: number; previousCtr: number; previousPosition: number; score: number; missedClicks: number };

function aggregateStrategy(rows: SearchRow[], keyIndex: number): Map<string, Totals> {
  const grouped = new Map<string, SearchRow[]>();
  for (const row of rows) {
    const key = String(row.keys?.[keyIndex] || '').trim();
    if (!key) continue;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(row);
  }
  return new Map([...grouped.entries()].map(([key, values]) => [key, totals(values)]));
}

function expectedCtr(position: number): number {
  if (position <= 1.5) return .28;
  if (position <= 3) return .16;
  if (position <= 5) return .09;
  if (position <= 10) return .055;
  if (position <= 20) return .025;
  return .012;
}

function strategyRows(current: Map<string, Totals>, previous: Map<string, Totals>): StrategyMetric[] {
  const keys = new Set([...current.keys(), ...previous.keys()]);
  const rows: StrategyMetric[] = [];
  for (const key of keys) {
    const now = current.get(key) || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
    const before = previous.get(key) || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
    const expected = expectedCtr(now.position || 100);
    const missedClicks = Math.max(0, Math.round(now.impressions * Math.max(0, expected - now.ctr)));
    const positionOpportunity = now.position >= 4 && now.position <= 20 ? Math.max(0, 21 - now.position) : 0;
    const score = Math.round(
      Math.min(100,
        Math.log10(now.impressions + 1) * 15 +
        positionOpportunity * 2.2 +
        Math.min(28, missedClicks * 1.4) +
        (now.clicks < before.clicks ? Math.min(18, (before.clicks - now.clicks) * 1.8) : 0)
      )
    );
    rows.push({
      key, ...now, deltaClicks: now.clicks - before.clicks, deltaImpressions: now.impressions - before.impressions,
      previousClicks: before.clicks, previousImpressions: before.impressions, previousCtr: before.ctr,
      previousPosition: before.position, score, missedClicks
    });
  }
  return rows;
}

function strategyStatus(current: Totals, previous: Totals): 'grow' | 'recover' | 'watch' | 'new' {
  if (!previous.impressions && current.impressions) return 'new';
  if (previous.clicks >= 5 && current.clicks < previous.clicks * .75) return 'recover';
  if (current.clicks > previous.clicks * 1.15 && current.clicks > previous.clicks + 2) return 'grow';
  return 'watch';
}

export async function strategyOverview(env: Env, email: string, token: string, days: number) {
  const sites = await listSites(env, email, token);
  const r = range(days);
  const previousEnd = relativeDay(-days - 3);
  const results: Array<Record<string, unknown>> = [];

  for (let i = 0; i < sites.length; i += 3) {
    const batch = await Promise.all(sites.slice(i, i + 3).map(async site => {
      try {
        const payload = await cached(env, ['strategy-v1', email, site.property, days, r.end].join(':'), CACHE_HOURS * 3600, async () => {
          const [currentRows, previousRows] = await Promise.all([
            analytics(token, site.property, { startDate: r.start, endDate: r.end, dimensions: ['query', 'page'], rowLimit: 1000 }),
            analytics(token, site.property, { startDate: r.previousStart, endDate: previousEnd, dimensions: ['query', 'page'], rowLimit: 1000 })
          ]);
          const currentTotal = totals(currentRows);
          const previousTotal = totals(previousRows);
          const queries = strategyRows(aggregateStrategy(currentRows, 0), aggregateStrategy(previousRows, 0));
          const pages = strategyRows(aggregateStrategy(currentRows, 1), aggregateStrategy(previousRows, 1));
          const opportunity = (x: StrategyMetric) => x.impressions >= 20 && x.position >= 4 && x.position <= 20;
          const ctrGap = (x: StrategyMetric) => x.impressions >= 80 && x.position > 0 && x.position <= 12 && x.missedClicks >= 2;
          const loss = (x: StrategyMetric) => x.previousClicks >= 3 && x.deltaClicks <= -2;
          const gain = (x: StrategyMetric) => x.clicks >= 2 && x.deltaClicks >= 2;

          const opportunities = queries.filter(opportunity).sort((a, b) => b.score - a.score).slice(0, 8);
          const lowCtr = queries.filter(ctrGap).sort((a, b) => b.missedClicks - a.missedClicks).slice(0, 6);
          const losses = queries.filter(loss).sort((a, b) => a.deltaClicks - b.deltaClicks).slice(0, 6);
          const winners = queries.filter(gain).sort((a, b) => b.deltaClicks - a.deltaClicks).slice(0, 6);
          const pageLosses = pages.filter(loss).sort((a, b) => a.deltaClicks - b.deltaClicks).slice(0, 6);
          const pageOpportunities = pages.filter(opportunity).sort((a, b) => b.score - a.score).slice(0, 6);

          const actions: Array<{ type: string; priority: number; title: string; detail: string; impact: number }> = [];
          if (!currentTotal.impressions) actions.push({ type: 'indexing', priority: 100, title: 'ตรวจการมองเห็นบน Google', detail: 'ช่วงนี้ไม่มี Impressions จากข้อมูล Search Console', impact: 100 });
          if (losses.length) actions.push({ type: 'recover', priority: 95, title: 'กู้คืนคำค้นหาที่เสีย Clicks', detail: losses[0].key, impact: Math.abs(losses.reduce((n, x) => n + Math.min(0, x.deltaClicks), 0)) });
          if (opportunities.length) actions.push({ type: 'rank', priority: 88, title: 'ดันคำใกล้หน้าแรก', detail: opportunities[0].key, impact: opportunities.reduce((n, x) => n + x.impressions, 0) });
          if (lowCtr.length) actions.push({ type: 'ctr', priority: 82, title: 'เพิ่ม CTR จากผลค้นหา', detail: lowCtr[0].key, impact: lowCtr.reduce((n, x) => n + x.missedClicks, 0) });
          if (pageLosses.length) actions.push({ type: 'page', priority: 78, title: 'ตรวจ Landing Page ที่เสียทราฟฟิก', detail: pageLosses[0].key, impact: Math.abs(pageLosses.reduce((n, x) => n + Math.min(0, x.deltaClicks), 0)) });

          return {
            current: currentTotal, previous: previousTotal, status: strategyStatus(currentTotal, previousTotal),
            opportunities, lowCtr, losses, winners, pageLosses, pageOpportunities,
            topQueries: queries.filter(x => x.impressions >= 5).sort((a, b) => b.impressions - a.impressions).slice(0, 60),
            actions: actions.sort((a, b) => b.priority - a.priority).slice(0, 4),
            sampledRows: currentRows.length, previousSampledRows: previousRows.length
          };
        });
        return { site, ...payload };
      } catch (error) {
        return { site, error: error instanceof Error ? error.message : 'Unable to analyze strategy' };
      }
    }));
    results.push(...batch);
  }

  const successful = results.filter((x: any) => x.current && !x.error) as any[];
  const portfolioActions = successful.flatMap((x: any) =>
    (x.actions || []).map((a: any) => ({ ...a, site: x.site, status: x.status }))
  ).sort((a: any, b: any) => b.priority - a.priority || b.impact - a.impact).slice(0, 16);

  const statusCount = { grow: 0, recover: 0, watch: 0, new: 0 };
  for (const x of successful) statusCount[x.status as keyof typeof statusCount]++;

  const overlapMap = new Map<string, Array<{ site: Site; clicks: number; impressions: number; position: number }>>();
  for (const x of successful) for (const q of (x.topQueries || []) as StrategyMetric[]) {
    const normalized = q.key.trim().toLocaleLowerCase();
    if (!normalized || q.impressions < 5) continue;
    if (!overlapMap.has(normalized)) overlapMap.set(normalized, []);
    overlapMap.get(normalized)!.push({ site: x.site, clicks: q.clicks, impressions: q.impressions, position: q.position });
  }
  const overlaps = [...overlapMap.entries()]
    .filter(([, entries]) => new Set(entries.map(x => x.site.id)).size >= 2)
    .map(([query, entries]) => ({
      query,
      sites: entries.sort((a, b) => b.impressions - a.impressions),
      impressions: entries.reduce((n, x) => n + x.impressions, 0),
      clicks: entries.reduce((n, x) => n + x.clicks, 0),
      competingTop20: entries.filter(x => x.position > 0 && x.position <= 20).length
    }))
    .sort((a, b) => (b.competingTop20 - a.competingTop20) || (b.impressions - a.impressions))
    .slice(0, 12);

  const portfolioClicks = successful.reduce((n, x) => n + (x.current?.clicks || 0), 0);
  const concentration = successful.map(x => ({ site: x.site, clicks: x.current?.clicks || 0 }))
    .sort((a, b) => b.clicks - a.clicks)[0];
  const concentrationShare = portfolioClicks && concentration ? concentration.clicks / portfolioClicks : 0;

  return {
    days,
    period: { start: r.start, end: r.end, previousStart: r.previousStart, previousEnd },
    sites: results,
    portfolioActions,
    overlaps,
    concentration: concentration ? { ...concentration, share: concentrationShare } : null,
    statusCount,
    connected: sites.length,
    successful: successful.length,
    partial: successful.length !== sites.length,
    updatedAt: new Date().toISOString(),
    methodology: 'GSC Search Analytics query+page dimensions, final web data; top 1000 rows per site and period'
  };
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
