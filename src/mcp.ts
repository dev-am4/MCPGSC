import type { Env } from './types';
import { HttpError } from './types';
import { constantEqual } from './security';
import { detailRows, getAccessToken, inspection, listSites, overview } from './google';

type Rpc = { jsonrpc?: string; id?: number | string | null; method?: string; params?: Record<string, unknown> };
const properties = (p: Record<string, unknown>) => ({
  property: typeof p.property === 'string' ? p.property : '',
  days: [7, 28, 90].includes(Number(p.days)) ? Number(p.days) : 28
});

const TOOLS = [
  { name: 'list_sites', description: 'List deduplicated verified Google Search Console sites. Domain properties take precedence over URL-prefix copies.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true, destructiveHint: false } },
  { name: 'get_overview', description: 'Get real Google Search Console clicks, impressions, CTR, average position and daily trends for all sites.',
    inputSchema: { type: 'object', properties: { days: { type: 'integer', enum: [7, 28, 90] } } },
    annotations: { readOnlyHint: true, destructiveHint: false } },
  { name: 'get_queries', description: 'Top organic Google Search queries for one authorized property.',
    inputSchema: { type: 'object', properties: {
      property: { type: 'string', description: 'Exact property value from list_sites' },
      days: { type: 'integer', enum: [7, 28, 90] } }, required: ['property'] },
    annotations: { readOnlyHint: true, destructiveHint: false } },
  { name: 'get_pages', description: 'Top organic search pages for one authorized property.',
    inputSchema: { type: 'object', properties: {
      property: { type: 'string' }, days: { type: 'integer', enum: [7, 28, 90] } }, required: ['property'] },
    annotations: { readOnlyHint: true, destructiveHint: false } },
  { name: 'inspect_url', description: 'Inspect a URL index status in an authorized Google Search Console property. Read-only.',
    inputSchema: { type: 'object', properties: {
      property: { type: 'string' }, url: { type: 'string' } }, required: ['property', 'url'] },
    annotations: { readOnlyHint: true, destructiveHint: false } }
];

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'
  } });
}
function reply(id: Rpc['id'], result: unknown): Response {
  return json({ jsonrpc: '2.0', id: id ?? null, result });
}
function rpcError(id: Rpc['id'], code: number, message: string, status = 200): Response {
  return json({ jsonrpc: '2.0', id: id ?? null, error: { code, message } }, status);
}

export async function handleMcp(req: Request, env: Env): Promise<Response> {
  if (!env.MCP_API_KEY || env.MCP_API_KEY.length < 32)
    return json({ error: 'MCP endpoint is not configured' }, 503);
  const origin = req.headers.get('Origin');
  if (origin && origin !== new URL(env.APP_URL).origin) return json({ error: 'Origin not allowed' }, 403);
  const bearer = req.headers.get('Authorization') || '';
  if (!bearer.startsWith('Bearer ') || !constantEqual(bearer.slice(7), env.MCP_API_KEY))
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: {
      'Content-Type': 'application/json', 'WWW-Authenticate': 'Bearer realm="MCPGSC"'
    } });
  if (req.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  let rpc: Rpc;
  try { rpc = await req.json() as Rpc; }
  catch { return rpcError(null, -32700, 'Invalid JSON', 400); }
  if (rpc.jsonrpc !== '2.0' || typeof rpc.method !== 'string') return rpcError(rpc.id, -32600, 'Invalid JSON-RPC request', 400);
  if (rpc.method === 'notifications/initialized' || rpc.method.startsWith('notifications/')) return new Response(null, { status: 202 });
  if (rpc.method === 'ping') return reply(rpc.id, {});
  if (rpc.method === 'initialize') return reply(rpc.id, {
    protocolVersion: '2025-06-18',
    capabilities: { tools: { listChanged: false } },
    serverInfo: { name: 'mcpgsc', version: '0.1.0' }
  });
  if (rpc.method === 'tools/list') return reply(rpc.id, { tools: TOOLS });
  if (rpc.method !== 'tools/call') return rpcError(rpc.id, -32601, 'Method not found', 404);
  const name = rpc.params?.name;
  if (typeof name !== 'string' || !TOOLS.some(t => t.name === name)) return rpcError(rpc.id, -32602, 'Unknown tool');
  const args = (rpc.params?.arguments && typeof rpc.params.arguments === 'object') ? rpc.params.arguments as Record<string, unknown> : {};
  try {
    const email = env.MCP_OWNER_EMAIL || (env.ALLOWED_EMAILS || '').split(',')[0]?.trim();
    if (!email) throw new HttpError(503, 'MCP owner email is not configured');
    const token = await getAccessToken(env, email);
    const input = properties(args);
    let result: unknown;
    if (name === 'list_sites') result = await listSites(env, email, token);
    else if (name === 'get_overview') result = await overview(env, email, token, input.days);
    else {
      if (!input.property) throw new HttpError(400, 'property is required');
      if (name === 'get_queries') result = await detailRows(env, email, token, input.property, 'query', input.days);
      if (name === 'get_pages') result = await detailRows(env, email, token, input.property, 'page', input.days);
      if (name === 'inspect_url') {
        if (typeof args.url !== 'string' || !args.url) throw new HttpError(400, 'url is required');
        result = await inspection(env, email, token, input.property, args.url);
      }
    }
    return reply(rpc.id, { content: [{ type: 'text', text: JSON.stringify(result) }] });
  } catch (error) {
    const message = error instanceof HttpError ? error.message : 'Unexpected MCP tool error';
    return reply(rpc.id, { content: [{ type: 'text', text: message }], isError: true });
  }
}
