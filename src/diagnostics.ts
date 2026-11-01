import type { Env } from './types';
import { analytics, getAccessToken, googleRequest, relativeDay } from './google';
import { handleMcp } from './mcp';
import { allowedEmail } from './security';

type Status = 'ok' | 'warning' | 'error';
type Check = { id: string; label: string; status: Status; detail: string; durationMs: number };
type Report = { status: Status; checkedAt: string; checks: Check[] };

async function check(id: string, label: string, task: () => Promise<{ status?: Status; detail: string }>): Promise<Check> {
  const start = Date.now();
  try {
    const result = await task();
    return { id, label, status: result.status || 'ok', detail: result.detail, durationMs: Date.now() - start };
  } catch (error) {
    // Do not leak Google responses, tokens, SQL queries, or API credentials.
    const isGoogle = id.startsWith('google');
    return {
      id, label, status: 'error',
      detail: isGoogle ? 'ตรวจสอบ Google ไม่สำเร็จ กรุณาดู Worker logs และตรวจสิทธิ์บัญชี Google' :
        'การตรวจสอบไม่สำเร็จ กรุณาดู Cloudflare Worker logs',
      durationMs: Date.now() - start
    };
  }
}

export async function diagnostics(env: Env, email: string): Promise<Report> {
  const checks: Check[] = [];
  checks.push(await check('database', 'Cloudflare D1', async () => {
    const [a, b] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) AS total FROM accounts').first<{ total: number }>(),
      env.DB.prepare('SELECT COUNT(*) AS total FROM cache').first<{ total: number }>()
    ]);
    return { detail: 'เชื่อมต่อฐานข้อมูลสำเร็จ · Accounts ' + (a?.total ?? 0) +
      ' · Cached records ' + (b?.total ?? 0) };
  }));

  // Refresh-token retrieval validates the actual Google OAuth connection rather
  // than merely reading a stored account row or looking at cached analytics.
  let token: string | undefined;
  checks.push(await check('google-oauth', 'Google OAuth', async () => {
    token = await getAccessToken(env, email);
    if (!token) throw new Error('No access token');
    return { detail: 'Refresh token ใช้งานได้ และขอ Access Token ใหม่สำเร็จ' };
  }));

  checks.push(await check('google-gsc', 'Search Console API', async () => {
    const activeToken = token;
    if (!activeToken) return { status: 'warning', detail: 'ยังไม่ได้ตรวจ เนื่องจาก OAuth ไม่พร้อมใช้งาน' };
    const response = await googleRequest<{ siteEntry?: Array<{ siteUrl: string }> }>(activeToken, '/webmasters/v3/sites');
    const sites = response.siteEntry || [];
    if (!sites.length) return { status: 'warning', detail: 'เชื่อม Google API สำเร็จ แต่ยังไม่พบ Property ที่มีสิทธิ์เข้าถึง' };
    return { detail: 'Google API ตอบกลับสำเร็จ · พบ ' + sites.length + ' Properties ก่อนรวมรายการซ้ำ' };
  }));

  checks.push(await check('search-analytics', 'Search Analytics', async () => {
    const activeToken = token;
    if (!activeToken) return { status: 'warning', detail: 'ยังไม่ได้ตรวจ เนื่องจาก OAuth ไม่พร้อมใช้งาน' };
    const response = await googleRequest<{ siteEntry?: Array<{ siteUrl: string }> }>(activeToken, '/webmasters/v3/sites');
    const site = response.siteEntry?.find(s => s.siteUrl.startsWith('sc-domain:')) || response.siteEntry?.[0];
    if (!site) return { status: 'warning', detail: 'ไม่พบ Property สำหรับทดสอบ Search Analytics' };
    const rows = await analytics(activeToken, site.siteUrl, {
      startDate: relativeDay(-9), endDate: relativeDay(-3), dimensions: ['date'], rowLimit: 1
    });
    return { detail: 'Query API ตอบกลับสำเร็จ · ตัวอย่าง ' + rows.length + ' แถว (ไม่แสดงข้อมูลส่วนตัว)' };
  }));

  checks.push(await check('mcp', 'MCP Server', async () => {
    if (!env.MCP_API_KEY || env.MCP_API_KEY.length < 32)
      return { status: 'warning', detail: 'ยังไม่ได้ตั้ง MCP_API_KEY ความยาวอย่างน้อย 32 ตัวอักษร' };
    const owner = (env.MCP_OWNER_EMAIL || env.ALLOWED_EMAILS.split(',')[0] || '').trim();
    if (!allowedEmail(owner, env))
      return { status: 'warning', detail: 'MCP_OWNER_EMAIL ไม่อยู่ในรายการ ALLOWED_EMAILS' };
    const account = await env.DB.prepare('SELECT email FROM accounts WHERE email = ?').bind(owner).first();
    if (!account) return { status: 'warning', detail: 'บัญชีสำหรับ MCP ยังไม่เคยเชื่อมต่อ Google' };
    const req = new Request(new URL('/mcp', env.APP_URL), {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + env.MCP_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} })
    });
    const response = await handleMcp(req, env);
    const data = await response.json() as { result?: { serverInfo?: { name?: string } } };
    if (!response.ok || data.result?.serverInfo?.name !== 'mcpgsc') throw new Error('MCP initialize failed');
    return { detail: 'MCP JSON-RPC initialize ทำงาน · Bearer Auth ผ่าน · บัญชีเจ้าของพร้อมใช้งาน' };
  }));

  const status: Status = checks.some(c => c.status === 'error') ? 'error' :
    checks.some(c => c.status === 'warning') ? 'warning' : 'ok';
  return { status, checkedAt: new Date().toISOString(), checks };
}
