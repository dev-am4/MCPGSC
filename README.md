# MCPGSC — Frank SEO Console

Minimal dark Google Search Console dashboard and read-only MCP server. Built for Cloudflare Workers + D1, without a frontend framework or fabricated metrics.

## Features
- Google OAuth with an allowed-email list and read-only Search Console access.
- Multi-site SEO overview with 7, 28, 90 days of clicks, impressions, CTR, weighted average position, chart and site comparison.
- Automatically choose Domain Properties instead of overlapping URL-prefix Properties.
- Queries, Pages, Google URL Inspection, and a read-only MCP JSON-RPC endpoint.
- Refresh tokens encrypted with AES-GCM and stored in D1. Short-lived cached analytics.
- Daily cache refresh at 09:00 Bangkok.

## Brand assets and System Diagnostics

- Logo: [assets/logo.svg](assets/logo.svg), transparent vector wordmark.
- Favicon: [assets/favicon.svg](assets/favicon.svg), square charcoal vector symbol.
- The Worker serves the same assets at `/logo.svg` and `/favicon.svg` for the desktop sidebar, mobile header, and browser tabs.
- After signing in, open **สถานะระบบ** (System Diagnostics) in the sidebar. It checks D1 database connectivity, Google refresh-token OAuth, Search Console properties, Search Analytics and the internal MCP JSON-RPC handshake without exposing credentials.
- `GET /api/diagnostics` requires a dashboard login and returns per-service `ok`, `warning`, or `error` results. The MCP check validates internal readiness, **not** connectivity from an external ChatGPT client.
- Metrics with zero impressions display average position as `—` rather than misleading `0.0`.

## Deploy from GitHub / Cloudflare Workers Builds

**Deploy command: `npx wrangler deploy`**. No custom build command is required.

This project uses Wrangler 4.45+'s **automatic D1 resource provisioning**. The `wrangler.toml` binding intentionally has no `database_id`; Wrangler attaches an existing matching D1 database or creates it on first deploy (if your Cloudflare account has the D1 provisioning permission). On first request, the Worker creates the `accounts` and `cache` tables with `CREATE TABLE IF NOT EXISTS`. You do not need to run `wrangler d1 create` or `schema.sql` for a new automated deployment.

**Important:** The deployed website cannot connect to Google until you set the required secrets:

| Secret | Meaning |
|---|---|
| APP_URL | Exact deployed origin, e.g. `https://mcpgsc.YOUR-SUBDOMAIN.workers.dev` (no trailing path) |
| GOOGLE_CLIENT_ID | Google OAuth web client ID |
| GOOGLE_CLIENT_SECRET | Google OAuth web client secret |
| ALLOWED_EMAILS | Comma-separated Google emails allowed to access dashboard |
| SESSION_SECRET | Random secret at least 32 characters |
| TOKEN_ENCRYPTION_KEY | Base64 of 32 cryptographically random bytes |
| MCP_API_KEY | Independent long random API key, at least 32 characters |
| MCP_OWNER_EMAIL | Allowed Google email used by MCP tools (recommended) |

Create secrets in Cloudflare Worker Settings → Variables and Secrets, or via `npx wrangler secret put KEY`. Never commit credentials.

To generate secrets with Node:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Use the first output for TOKEN_ENCRYPTION_KEY. Run the second command **twice**, using separate outputs for SESSION_SECRET and MCP_API_KEY.

In [Google Cloud Console](https://console.cloud.google.com/):
1. Enable **Google Search Console API**.
2. Configure the OAuth consent screen and add permitted test users if the app is in Testing mode.
3. Create an OAuth **Web application** client.
4. Add `https://YOUR-ACTUAL-HOST/auth/callback` as an Authorized redirect URI. It must match `APP_URL` exactly plus `/auth/callback`.
5. Copy client ID and secret into the Cloudflare Worker secrets.

Open the deployed app, connect the authorized Google account, then the dashboard will show its verified Search Console properties. Google data is generally delayed by 2–3 days. Authentication is read-only.

## Local development

```bash
npm install
cp .dev.vars.example .dev.vars
# Edit .dev.vars, APP_URL=http://localhost:8787
# Add http://localhost:8787/auth/callback to Google OAuth redirect URIs
npm run typecheck
npm run dev
```

## Manual D1 fallback (only if auto-provisioning fails)

If Cloudflare returns a D1 provisioning or permissions error:
```bash
npx wrangler d1 create mcpgsc
npx wrangler d1 list --json
```
Copy the genuine UUID for `mcpgsc` into the `[[d1_databases]]` block as `database_id = "YOUR-REAL-UUID"` and deploy again. Never use a guessed ID. The Worker will initialize the tables on its first request, even in manual mode.

Optional: The repository also contains `schema.sql` for manual database administration. D1 CLI `--remote` may require a real `database_id` in TOML even when the deploy created it automatically. Use the Cloudflare dashboard or a temporary config with the correct ID for remote administration.

## MCP

Endpoint: `https://YOUR-HOST/mcp`

Supply `Authorization: Bearer YOUR_MCP_API_KEY`. Stateless Streamable HTTP JSON-RPC protocol `2025-06-18` offers:
- `list_sites`
- `get_overview`
- `get_queries`
- `get_pages`
- `inspect_url`

Some ChatGPT custom MCP connections require a full OAuth authorization flow instead of a static bearer header; that extra flow is **not implemented** in this version. Avoid putting secrets in URLs.

## Notes

- Search Analytics may omit anonymized queries. Queries/Pages display the top 250 API rows, not necessarily all traffic.
- Failed site queries are labeled; dashboard totals include only successful sites.
- Changing TOKEN_ENCRYPTION_KEY requires connected Google accounts to reconnect.
- Disconnect deletes the encrypted refresh token and cached data, but does not revoke Google-side access. Revoke access through your Google account if required.
- Avoid disabling Wrangler's auto-provisioning flag (`--no-x-provision`) unless you have bound a real D1 ID manually.

Documentation: [Cloudflare automatic provisioning](https://developers.cloudflare.com/changelog/post/2025-10-24-automatic-resource-provisioning/) · [Google Search Console API](https://developers.google.com/webmaster-tools/v1/api_reference_index)
