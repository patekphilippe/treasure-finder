/** Bindings from wrangler.toml and secrets set with `wrangler secret put`. */
export interface Env {
  DB: D1Database;
  SOURCES: R2Bucket;
  CONTEXT: R2Bucket;
  ALLOWED_ORIGINS: string;
  MONTHLY_BUDGET_USD: string;
  PRIVATE_DAILY_LIMIT: string;
  ANTHROPIC_API_KEY: string;
  TURNSTILE_SECRET: string;
  /** long random secret for the review panel (wrangler secret put ADMIN_TOKEN) */
  ADMIN_TOKEN: string;
}
