/** Bindings from wrangler.toml and secrets set with `wrangler secret put`. */
export interface Env {
  DB: D1Database;
  /** uploaded photos and texts (Workers KV: free plan, no card; values up to 25 MB) */
  SOURCES: KVNamespace;
  /** approved context packs and their index */
  CONTEXT: KVNamespace;
  ALLOWED_ORIGINS: string;
  MONTHLY_BUDGET_USD: string;
  PRIVATE_DAILY_LIMIT: string;
  ANTHROPIC_API_KEY: string;
  TURNSTILE_SECRET: string;
  /** long random secret for the review panel (wrangler secret put ADMIN_TOKEN) */
  ADMIN_TOKEN: string;
}
