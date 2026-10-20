/** Bindings from wrangler.toml and secrets set with `wrangler secret put`. */
export interface Env {
  DB: D1Database;
  /** uploaded photos and texts (Workers KV: free plan, no card; values up to 25 MB) */
  SOURCES: KVNamespace;
  /** approved context packs and their index */
  CONTEXT: KVNamespace;
  /** rendered relief tiles (R2, docs/BACKEND.md); without it every tile is rendered anew */
  TILES?: R2Bucket;
  /**
   * Only for local `wrangler dev`, whose runtime cannot open mapy.geoportal.gov.pl (the edge can):
   * a plain-HTTP proxy in front of the NMT WCS (docs/BACKEND.md).
   */
  NMT_WCS_URL?: string;
  ALLOWED_ORIGINS: string;
  MONTHLY_BUDGET_USD: string;
  PRIVATE_DAILY_LIMIT: string;
  /** "true" in the test phase: what an admin shares goes to the shared base without review */
  ADMIN_AUTO_PUBLISH?: string;
  ANTHROPIC_API_KEY: string;
  /** long random secret for the review panel from scripts (wrangler secret put ADMIN_TOKEN) */
  ADMIN_TOKEN: string;
  /** Auth0 tenant, e.g. `treasure-finder.eu.auth0.com`; empty: nobody can sign in (docs/BACKEND.md) */
  AUTH0_DOMAIN: string;
  /** identifier of this API in Auth0: the audience of the access tokens */
  AUTH0_AUDIENCE: string;
  /** the owner's sign-in addresses, comma-separated (secret: the repository is public) */
  ADMIN_EMAILS?: string;
  /** shared with the Auth0 Post-Login Action that asks /api/auth/check */
  AUTH0_ACTION_SECRET?: string;
  /** Only for tests: the tenant's JWKS inline instead of fetching it. */
  AUTH0_JWKS?: string;
}
