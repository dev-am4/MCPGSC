# MCPGSC — Frank SEO Console

Minimal dark Google Search Console dashboard and read-only MCP server for multiple websites. Built for Cloudflare Workers + D1, without a frontend framework or fake analytics.

## Features

- Google OAuth 2.0, strict allowed-email list and read-only Search Console access.
- Deduplicated properties: a Domain Property takes priority over overlapping URL-prefix properties. www is normalized.
- Overview for 7/28/90 days, clicks, impressions, CTR, weighted average position, daily chart and site comparisons.
- Google Search queries, pages and URL Inspection.
- MCP endpoint at POST /mcp, with five read-only tools.
- AES-GCM encrypted Google refresh tokens stored in D1, HMAC-signed HTTP-only sessions, read-only MCP bearer secret.
- Daily automatic cache warming at 09:00 Bangkok (02:00 UTC).

## Quick setup

1. Clone the repository, then run npm install.
2. Run npx wrangler login and npx wrangler d1 create mcpgsc. Copy the returned database ID into wrangler.toml.
3. Run npm run db:local, then npm run db:remote.
4. In Google Cloud Console (https://console.cloud.google.com/), enable Google Search Console API and create an OAuth Web application client. Set the authorized redirect URIs to http://localhost:8787/auth/callback for local development and https://YOUR-DOMAIN/auth/callback for production. Configure the consent screen and add Google test users if the app is in Testing status.
5. Copy .dev.vars.example to .dev.vars. Set APP_URL to the matching origin, GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET from Google Cloud, ALLOWED_EMAILS to a comma-separated list of permitted accounts, SESSION_SECRET to a random 48-byte hex string, TOKEN_ENCRYPTION_KEY to base64 of 32 random bytes, MCP_API_KEY to a separate long random string and MCP_OWNER_EMAIL to your Google email.
6. Example secret generation with Node.js: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))" for the encryption key and node -e "console.log(require('crypto').randomBytes(48).toString('hex'))" for session and MCP secrets (run separately).
7. Run npm run typecheck and npm run dev. Open http://localhost:8787 and connect your approved Google account.
8. For production, upload each secret using npx wrangler secret put NAME (including APP_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ALLOWED_EMAILS, SESSION_SECRET, TOKEN_ENCRYPTION_KEY, MCP_API_KEY, MCP_OWNER_EMAIL), then deploy manually with npm run deploy.

IMPORTANT: The repository does not include production credentials, D1 database ID or real SEO data. Google OAuth must be configured before analytics will load. Google OAuth Testing-mode refresh tokens can expire after seven days depending on Google's rules.

## MCP

Endpoint: https://YOUR-DOMAIN/mcp

Use Authorization: Bearer YOUR_MCP_API_KEY and Content-Type: application/json. This endpoint implements the stateless Streamable HTTP JSON-RPC transport for MCP version 2025-06-18, with tools: list_sites, get_overview, get_queries, get_pages and inspect_url. It uses MCP_OWNER_EMAIL, or the first ALLOWED_EMAILS account if MCP_OWNER_EMAIL is not provided. That account must first connect through the web dashboard.

Sample:
curl -X POST https://YOUR-DOMAIN/mcp -H "Authorization: Bearer YOUR_MCP_API_KEY" -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

Some ChatGPT MCP connectors require OAuth authorization, not static bearer-token configuration. This project does not yet implement the MCP OAuth handshake. An OAuth-capable gateway or additional OAuth authorization endpoints will be required for those connectors. Never place the MCP key in a URL or commit it.

## Structure

- src/index.ts: Worker routes, OAuth, API and cron
- src/google.ts: Google API and deduplicated site analytics
- src/security.ts: signed sessions and encrypted tokens
- src/mcp.ts: MCP tools
- src/ui.ts: responsive dark dashboard without a frontend framework
- src/types.ts: shared definitions
- schema.sql: D1 storage

## Data notes

- GSC data may be delayed by 2-3 days. Data ranges end three days before UTC today.
- Failed properties are flagged and excluded from the overview total, which is marked partial.
- Search Analytics may omit anonymized queries. Detail screens request the top 250 rows, not all available rows.
- The daily cron warms 7-day and 28-day periods; 90-day data is retrieved on demand.
- Disconnect removes stored refresh tokens and cache; Google-side grant revocation must be completed from your Google account settings.
- If TOKEN_ENCRYPTION_KEY changes, previously stored encrypted tokens can no longer be read.
- Never deploy with example secrets or expose the MCP bearer token.

References: https://developers.google.com/webmaster-tools/v1/api_reference_index and https://modelcontextprotocol.io/specification/2025-06-18/basic/transports
