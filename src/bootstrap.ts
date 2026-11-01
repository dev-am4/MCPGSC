import type { Env } from './types';

// With Wrangler automatic D1 provisioning, the database can be empty on its
// first deployment. Initialize its tables once per Worker isolate on first use.
// CREATE IF NOT EXISTS is safe for existing installations and concurrent isolates.
let initialized: Promise<void> | undefined;

export function ensureSchema(env: Env): Promise<void> {
  if (!initialized) {
    initialized = (async () => {
      if (!env.DB) throw new Error('D1 binding DB was not provisioned');
      await env.DB.prepare(
        'CREATE TABLE IF NOT EXISTS accounts (email TEXT PRIMARY KEY, google_sub TEXT NOT NULL, refresh_cipher TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)'
      ).run();
      await env.DB.prepare(
        'CREATE TABLE IF NOT EXISTS cache (cache_key TEXT PRIMARY KEY, payload TEXT NOT NULL, expires_at INTEGER NOT NULL)'
      ).run();
      await env.DB.prepare(
        'CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expires_at)'
      ).run();
      await env.DB.prepare('CREATE TABLE IF NOT EXISTS oauth_clients (client_id TEXT PRIMARY KEY, redirect_uris TEXT NOT NULL, created_at INTEGER NOT NULL)').run();
      await env.DB.prepare('CREATE TABLE IF NOT EXISTS oauth_codes (code_hash TEXT PRIMARY KEY, client_id TEXT NOT NULL, email TEXT NOT NULL, redirect_uri TEXT NOT NULL, challenge TEXT NOT NULL, resource TEXT NOT NULL, scope TEXT NOT NULL, expires_at INTEGER NOT NULL)').run();
      await env.DB.prepare('CREATE TABLE IF NOT EXISTS oauth_tokens (token_hash TEXT PRIMARY KEY, email TEXT NOT NULL, client_id TEXT NOT NULL, kind TEXT NOT NULL, resource TEXT NOT NULL, scope TEXT NOT NULL, expires_at INTEGER NOT NULL)').run();
      await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_oauth_token_expiry ON oauth_tokens(expires_at)').run();
    })().catch((error: unknown) => {
      // Allow a retry if a temporary D1 error occurs.
      initialized = undefined;
      throw error;
    });
  }
  return initialized;
}
