import type { Env } from './types';
import { HttpError } from './types';
import { allowedEmail, cookie, createSession, encryptToken, randomState, readSession, validateConfig, constantEqual } from './security';
import { detailRows, getAccessToken, getAccount, inspection, listSites, overview, strategyOverview, segmentRows, sitemapRows } from './google';
import { handleMcp } from './mcp';
import { HTML } from './ui';
import { diagnostics } from './diagnostics';
import { dashboardSnapshot } from './snapshot';
import { ensureSchema } from './bootstrap';
import { authDiscovery, registerClient } from './oauth-register';
import { authorize, approve } from './oauth-approval';
import { exchangeToken, cleanOAuth } from './oauth-tokens';

const json = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' }
});

function guardOrigin(req: Request, env: Env): void {
  const origin = req.headers.get('Origin');
  if (origin && origin !== new URL(env.APP_URL).origin) throw new HttpError(403, 'Cross-origin requests are not permitted');
}

function appUrl(env: Env): string { return env.APP_URL.replace(/\/+$/, ''); }
function googleClientId(env: Env): string {
  const raw = String(env.GOOGLE_CLIENT_ID || '').trim();
  const match = raw.match(/[0-9]+-[A-Za-z0-9._-]+\.apps\.googleusercontent\.com/);
  if (!match) throw new Error('GOOGLE_CLIENT_ID is invalid');
  return match[0];
}
function googleClientSecret(env: Env): string {
  const raw = String(env.GOOGLE_CLIENT_SECRET || '').trim();
  const match = raw.match(/GOCSPX-[A-Za-z0-9_-]+/);
  const value = match ? match[0] : raw;
  if (value.length < 12) throw new Error('GOOGLE_CLIENT_SECRET is invalid');
  return value;
}
function loginUrl(env: Env): string {
  const u = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  u.searchParams.set('client_id', googleClientId(env));
  u.searchParams.set('redirect_uri', appUrl(env) + '/auth/callback');
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('scope', 'openid email https://www.googleapis.com/auth/webmasters.readonly');
  u.searchParams.set('access_type', 'offline');
  u.searchParams.set('prompt', 'consent');
  return u.toString();
}

async function callback(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const state = url.searchParams.get('state') || '';
  const code = url.searchParams.get('code');
  const saved = req.headers.get('Cookie')?.split(';').map(s => s.trim()).find(s => s.startsWith('mcpgsc_oauth='));
  const expected = saved ? decodeURIComponent(saved.slice('mcpgsc_oauth='.length)) : '';
  if (!code || !state || !expected || !constantEqual(state, expected))
    throw new HttpError(400, 'Google login verification failed. Please restart the login.');
  const form = new URLSearchParams({
    client_id: googleClientId(env),
    client_secret: googleClientSecret(env),
    redirect_uri: appUrl(env) + '/auth/callback',
    code, grant_type: 'authorization_code'
  });
  const exchange = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: form });
  const token = await exchange.json() as { access_token?: string; refresh_token?: string; error?: string };
  if (!exchange.ok || !token.access_token)
    throw new HttpError(502, 'Google OAuth exchange failed: ' + (token.error || exchange.status));

  const profileRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: 'Bearer ' + token.access_token }
  });
  const profile = await profileRes.json() as { email?: string; email_verified?: boolean; sub?: string };
  if (!profileRes.ok || !profile.email_verified || !profile.email || !profile.sub || !allowedEmail(profile.email, env))
    throw new HttpError(403, 'This Google account is not in ALLOWED_EMAILS');

  const existing = await env.DB.prepare('SELECT google_sub, refresh_cipher FROM accounts WHERE email=?')
    .bind(profile.email).first<{ google_sub: string; refresh_cipher: string }>();
  const refresh = token.refresh_token
    ? await encryptToken(token.refresh_token, env)
    : (existing && existing.google_sub === profile.sub ? existing.refresh_cipher : '');
  if (!refresh) throw new HttpError(400, 'Google did not provide an offline refresh token. Revoke the app in Google permissions and reconnect.');
  await env.DB.prepare('INSERT INTO accounts (email,google_sub,refresh_cipher,updated_at) VALUES (?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(email) DO UPDATE SET google_sub=excluded.google_sub,refresh_cipher=excluded.refresh_cipher,updated_at=CURRENT_TIMESTAMP')
    .bind(profile.email, profile.sub, refresh).run();

  const nextCookie = req.headers.get('Cookie')?.split(';').map(s=>s.trim())
    .find(s=>s.startsWith('mcpgsc_oauth_next='));
  let next = '/';
  if (nextCookie) {
    try {
      const stored = decodeURIComponent(nextCookie.slice('mcpgsc_oauth_next='.length));
      if (stored.startsWith('/oauth/authorize?') && stored.length < 3800) next = stored;
    } catch { /* discard invalid resume path */ }
  }
  const response = new Response(null, { status: 302, headers: { Location: appUrl(env) + next } });
  response.headers.append('Set-Cookie', cookie('mcpgsc_oauth', '', req, 0));
  response.headers.append('Set-Cookie', cookie('mcpgsc_oauth_next', '', req, 0));
  response.headers.append('Set-Cookie', cookie('mcpgsc_session', await createSession(profile.email, env), req, 30 * 86400));
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

async function authUser(req: Request, env: Env): Promise<string> {
  const email = await readSession(req, env);
  if (!email) throw new HttpError(401, 'Please connect your Google account first');
  await getAccount(env, email);
  return email;
}

async function handleApi(req: Request, env: Env, url: URL): Promise<Response> {
  const path = url.pathname;
  const method = req.method;
  if (path === '/api/me' && method === 'GET') {
    const email = await readSession(req, env);
    if (!email) return json({ authenticated: false });
    const account = await env.DB.prepare('SELECT email FROM accounts WHERE email=?').bind(email).first();
    return account ? json({ authenticated: true, email }) : json({ authenticated: false });
  }
  const email = await authUser(req, env);
  if (path === '/api/snapshot' && method === 'GET') return json(await dashboardSnapshot(env,email,getDays(url.searchParams.get('days'))));
  if (path === '/api/diagnostics' && method === 'GET') {
    return json(await diagnostics(env, email));
  }
  if (path === '/api/sites' && method === 'GET') {
    const token = await getAccessToken(env, email);
    return json(await listSites(env, email, token));
  }
  if (path === '/api/overview' && method === 'GET') {
    const days = getDays(url.searchParams.get('days'));
    const token = await getAccessToken(env, email);
    return json(await overview(env, email, token, days));
  }
  if (path === '/api/strategy' && method === 'GET') {
    const days = getDays(url.searchParams.get('days'));
    const token = await getAccessToken(env, email);
    return json(await strategyOverview(env, email, token, days));
  }

  if (path === '/api/segments' && method === 'GET') {
    const property = url.searchParams.get('property') || '';
    const dimension = url.searchParams.get('dimension') || '';
    if (!property) throw new HttpError(400, 'property is required');
    if (!['device', 'country', 'searchAppearance'].includes(dimension))
      throw new HttpError(400, 'dimension must be device, country, or searchAppearance');
    const token = await getAccessToken(env, email);
    return json(await segmentRows(env, email, token, property,
      dimension as 'device' | 'country' | 'searchAppearance', getDays(url.searchParams.get('days'))));
  }
  if (path === '/api/sitemaps' && method === 'GET') {
    const property = url.searchParams.get('property') || '';
    if (!property) throw new HttpError(400, 'property is required');
    const token = await getAccessToken(env, email);
    return json(await sitemapRows(env, email, token, property));
  }
  if (path === '/api/details' && method === 'GET') {
    const dimension = url.searchParams.get('dimension');
    if (dimension !== 'query' && dimension !== 'page') throw new HttpError(400, 'dimension must be query or page');
    const property = url.searchParams.get('property') || '';
    if (!property) throw new HttpError(400, 'property is required');
    const token = await getAccessToken(env, email);
    return json(await detailRows(env, email, token, property, dimension, getDays(url.searchParams.get('days'))));
  }
  if (path === '/api/inspect' && method === 'POST') {
    guardOrigin(req, env);
    const body = await req.json() as { property?: unknown; url?: unknown };
    if (typeof body?.property !== 'string' || typeof body?.url !== 'string') throw new HttpError(400, 'property and url are required');
    const token = await getAccessToken(env, email);
    return json(await inspection(env, email, token, body.property, body.url));
  }
  if (path === '/api/refresh' && method === 'POST') {
    guardOrigin(req, env);
    await env.DB.prepare('DELETE FROM cache WHERE cache_key LIKE ? OR cache_key LIKE ? OR cache_key LIKE ? OR cache_key LIKE ? OR cache_key LIKE ? OR cache_key LIKE ? OR cache_key LIKE ? OR cache_key LIKE ?')
      .bind('sites:' + email, 'metrics:' + email + ':%', 'metrics-v2:' + email + ':%', 'detail:' + email + ':%', 'strategy-v1:' + email + ':%', 'segment-v1:' + email + ':%', 'sitemap-v1:' + email + ':%', 'snapshot-v1:' + email + ':%').run();
    return json(await dashboardSnapshot(env,email,getDays(url.searchParams.get('days'))));
  }
  if (path === '/api/disconnect' && method === 'POST') {
    guardOrigin(req, env);
    await env.DB.prepare('DELETE FROM accounts WHERE email=?').bind(email).run();
    await env.DB.prepare('DELETE FROM cache WHERE cache_key LIKE ? OR cache_key LIKE ? OR cache_key LIKE ? OR cache_key LIKE ? OR cache_key LIKE ? OR cache_key LIKE ? OR cache_key LIKE ?')
      .bind('sites:' + email, 'metrics:' + email + ':%', 'metrics-v2:' + email + ':%', 'detail:' + email + ':%', 'strategy-v1:' + email + ':%', 'segment-v1:' + email + ':%', 'sitemap-v1:' + email + ':%', 'snapshot-v1:' + email + ':%').run();
    const response = json({ disconnected: true });
    response.headers.append('Set-Cookie', cookie('mcpgsc_session', '', req, 0));
    return response;
  }
  throw new HttpError(404, 'API route not found');
}

function getDays(input: string | null): number {
  const n = Number(input || 28);
  if (![7, 28, 90].includes(n)) throw new HttpError(400, 'days must be 7, 28, or 90');
  return n;
}

async function appFetch(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  if (req.method === 'GET' && (url.pathname === '/generated-logo.png' || url.pathname === '/generated-favicon.png')) {
    return env.ASSETS.fetch(req);
  }
  if (req.method === 'GET' && (url.pathname === '/logo.svg' || url.pathname === '/favicon.svg' || url.pathname === '/favicon.ico')) {
    const file = url.pathname === '/logo.svg' ? '/generated-logo.png' : '/generated-favicon.png';
    return Response.redirect(new URL(file + '?brand=global3', url.origin).toString(), 302);
  }
  if (url.pathname === '/health' && req.method === 'GET') return json({ status: 'ok', service: 'mcpgsc' });
  if (url.pathname === '/mcp') {
    await ensureSchema(env);
    return handleMcp(req, env);
  }
  if (url.pathname === '/' && req.method === 'GET') return new Response(HTML, { headers: {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-cache',
    'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff'
  } });
  // Starting Google OAuth does not require D1 or encryption configuration.
  // Keeping this route isolated makes login resilient to unrelated service issues.
  if (url.pathname === '/auth/google' && req.method === 'GET') {
    const state = randomState();
    const redirect = new URL(loginUrl(env));
    redirect.searchParams.set('state', state);
    const response = new Response(null, { status: 302, headers: { Location: redirect.toString() } });
    response.headers.append('Set-Cookie', cookie('mcpgsc_oauth', state, req, 600));
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }
  validateConfig(env);
  await ensureSchema(env);
  if (req.method === 'GET' && (
      url.pathname === '/.well-known/oauth-protected-resource' ||
      url.pathname === '/.well-known/oauth-protected-resource/mcp'))
    return authDiscovery(env, true);
  if (req.method === 'GET' && url.pathname === '/.well-known/oauth-authorization-server')
    return authDiscovery(env, false);
  if (url.pathname === '/oauth/register') return registerClient(req, env);
  if (req.method === 'GET' && url.pathname === '/oauth/authorize') return authorize(req, env);
  if (req.method === 'POST' && url.pathname === '/oauth/approve') return approve(req, env);
  if (req.method === 'POST' && url.pathname === '/oauth/token') return exchangeToken(req, env);
  if (url.pathname === '/auth/callback' && req.method === 'GET') return callback(req, env);
  if (url.pathname === '/auth/logout' && req.method === 'POST') {
    guardOrigin(req, env);
    const response = json({ ok: true });
    response.headers.append('Set-Cookie', cookie('mcpgsc_session', '', req, 0));
    return response;
  }
  if (url.pathname.startsWith('/api/')) return handleApi(req, env, url);
  return json({ error: 'Not found' }, 404);
}

async function warmCache(env: Env): Promise<void> {
  validateConfig(env);
  await ensureSchema(env);
  await cleanOAuth(env);
  const result = await env.DB.prepare('SELECT email FROM accounts').all<{ email: string }>();
  for (const account of result.results) {
    try {
      const token = await getAccessToken(env, account.email);
      await listSites(env, account.email, token, true);
      await overview(env, account.email, token, 7);
      await overview(env, account.email, token, 28);
      await strategyOverview(env, account.email, token, 28);
    } catch (error) {
      console.error('Scheduled GSC refresh failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  }
  await env.DB.prepare('DELETE FROM cache WHERE expires_at < ?').bind(Date.now() - 7 * 86400000).run();
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    try { return await appFetch(req, env); }
    catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      const message = error instanceof HttpError ? error.message : 'Unexpected server error';
      console.error('MCPGSC request:', status, message);
      return json({ error: message }, status);
    }
  },
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(warmCache(env));
  }
} satisfies ExportedHandler<Env>;
