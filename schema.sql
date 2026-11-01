CREATE TABLE IF NOT EXISTS accounts (
  email TEXT PRIMARY KEY,
  google_sub TEXT NOT NULL,
  refresh_cipher TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cache (
  cache_key TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expires_at);

-- OAuth 2.1 MCP authorization (public clients + PKCE; tokens are stored hashed)
CREATE TABLE IF NOT EXISTS oauth_clients (client_id TEXT PRIMARY KEY, redirect_uris TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS oauth_codes (code_hash TEXT PRIMARY KEY, client_id TEXT NOT NULL, email TEXT NOT NULL, redirect_uri TEXT NOT NULL, challenge TEXT NOT NULL, resource TEXT NOT NULL, scope TEXT NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS oauth_tokens (token_hash TEXT PRIMARY KEY, email TEXT NOT NULL, client_id TEXT NOT NULL, kind TEXT NOT NULL, resource TEXT NOT NULL, scope TEXT NOT NULL, expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_oauth_token_expiry ON oauth_tokens(expires_at);
