import type { Env } from './types';

const e = new TextEncoder();
export const authRoot = (env: Env) => env.APP_URL.replace(/\/+$/, '');
export const authAudience = (env: Env) => authRoot(env) + '/mcp';
export const authScope = 'gsc:read';

export const randomSecret = () => {
  const a = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...a)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
};
export const hashSecret = async (v: string): Promise<string> => {
  const a = new Uint8Array(await crypto.subtle.digest('SHA-256',e.encode(v)));
  return btoa(String.fromCharCode(...a)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
};
export const hmac = async (v: string, env: Env): Promise<string> => {
  const key = await crypto.subtle.importKey('raw',e.encode(env.SESSION_SECRET),
    {name:'HMAC',hash:'SHA-256'},false,['sign']);
  const a = new Uint8Array(await crypto.subtle.sign('HMAC',key,e.encode(v)));
  return btoa(String.fromCharCode(...a)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
};
export const safeRedirect = (s: string) =>
  s === 'https://chatgpt.com/connector_platform_oauth_redirect' ||
  /^https:\/\/chatgpt\.com\/connector\/oauth\/[A-Za-z0-9_-]+$/.test(s);
export const oauthJson = (body: unknown, status=200) =>
  new Response(JSON.stringify(body),{status,headers:{
    'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff','Pragma':'no-cache'}});
export const oauthError = (error: string, description: string, status=400) =>
  oauthJson({error,error_description:description},status);
export const escapeHtml = (s:string) => s.replace(/[&<>"']/g,ch =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]!));
export const authPage = (body:string,status=200) =>
  new Response('<!doctype html><html lang="th"><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>MCPGSC OAuth</title><style>body{background:#212121;color:#eee;font:14px system-ui;'+
    'min-height:95vh;display:grid;place-items:center}main{max-width:460px;padding:30px}'+
    'p{color:#bbb;line-height:1.8}button{border:0;border-radius:9px;padding:12px 20px;'+
    'cursor:pointer;margin-right:10px}</style><main>'+body+'</main></html>',{
    status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store',
    'Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
    'Referrer-Policy':'no-referrer','X-Frame-Options':'DENY'}});
export const decodeBase64 = (s:string) => {
  const b=atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4));
  return new TextDecoder().decode(Uint8Array.from(b,c=>c.charCodeAt(0)));
};
