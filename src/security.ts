import type { Env } from './types';

const enc = new TextEncoder();
const dec = new TextDecoder();

function toB64(bytes: Uint8Array): string {
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64(data: string): Uint8Array {
  const base = data.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(base + '='.repeat((4 - base.length % 4) % 4));
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return toB64(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(data))));
}

export function constantEqual(a: string, b: string): boolean {
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

export async function createSession(email: string, env: Env): Promise<string> {
  const payload = toB64(enc.encode(JSON.stringify({ email, exp: Date.now() + 30 * 86400000 })));
  return payload + '.' + await hmac(env.SESSION_SECRET, payload);
}

export async function readSession(req: Request, env: Env): Promise<string | null> {
  const cookie = req.headers.get('Cookie')?.split(';').map(s => s.trim()).find(s => s.startsWith('mcpgsc_session='));
  if (!cookie) return null;
  try {
    const [body, sig] = decodeURIComponent(cookie.slice('mcpgsc_session='.length)).split('.');
    if (!body || !sig || !constantEqual(await hmac(env.SESSION_SECRET, body), sig)) return null;
    const data = JSON.parse(dec.decode(fromB64(body))) as { email: string; exp: number };
    if (!data.exp || data.exp < Date.now() || typeof data.email !== 'string') return null;
    if (!allowedEmail(data.email, env)) return null;
    return data.email;
  } catch { return null; }
}

export function allowedEmail(email: string, env: Env): boolean {
  const allowed = (env.ALLOWED_EMAILS || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  return allowed.length > 0 && allowed.includes(email.toLowerCase());
}

export function cookie(name: string, value: string, req: Request, maxAge: number): string {
  const secure = new URL(req.url).protocol === 'https:' ? '; Secure' : '';
  return name + '=' + encodeURIComponent(value) + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + maxAge + secure;
}

export function randomState(): string {
  return toB64(crypto.getRandomValues(new Uint8Array(32)));
}

async function aesKey(env: Env): Promise<CryptoKey> {
  const raw = fromB64(env.TOKEN_ENCRYPTION_KEY);
  if (raw.length !== 32) throw new Error('TOKEN_ENCRYPTION_KEY must be base64 of 32 bytes');
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptToken(token: string, env: Env): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(env), enc.encode(token)));
  return toB64(iv) + '.' + toB64(data);
}

export async function decryptToken(cipher: string, env: Env): Promise<string> {
  const [a, b] = cipher.split('.');
  if (!a || !b) throw new Error('Invalid encrypted credential');
  const iv = fromB64(a);
  const clear = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, await aesKey(env), fromB64(b));
  return dec.decode(clear);
}

export function validateConfig(env: Env): void {
  for (const key of ['APP_URL','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','ALLOWED_EMAILS','SESSION_SECRET','TOKEN_ENCRYPTION_KEY'] as const) {
    if (!env[key]) throw new Error('Missing required configuration: ' + key);
  }
  if (env.SESSION_SECRET.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters');
  const app = new URL(env.APP_URL);
  if (app.protocol !== 'https:' && app.hostname !== 'localhost' && app.hostname !== '127.0.0.1') throw new Error('APP_URL requires HTTPS');
}
