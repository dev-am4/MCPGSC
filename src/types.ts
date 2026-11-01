export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  APP_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  ALLOWED_EMAILS: string;
  SESSION_SECRET: string;
  TOKEN_ENCRYPTION_KEY: string;
  MCP_API_KEY: string;
  MCP_OWNER_EMAIL?: string;
}

export type Account = {
  email: string;
  google_sub: string;
  refresh_cipher: string;
};

export type Property = {
  siteUrl: string;
  permissionLevel: string;
};

export type Site = {
  id: string;
  label: string;
  property: string;
  variants: string[];
  permission: string;
};

export type SearchRow = {
  keys?: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type SearchResponse = { rows?: SearchRow[]; responseAggregationType?: string };

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
