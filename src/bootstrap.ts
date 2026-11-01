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
    })().catch((error: unknown) => {
      // Allow a retry if a temporary D1 error occurs.
      initialized = undefined;
      throw error;
    });
  }
  return initialized;
}
