/**
 * Optional backend (server/, docs/BACKEND.md): source submissions and AI map reading. Both values
 * are public (the browser sees them anyway); a build may override them, e.g. for a test worker.
 */
const DEFAULT_API_URL = 'https://treasure-finder-api.treasure-finder-server.workers.dev';
// Cloudflare Turnstile site key of the widget for patekphilippe.github.io (public by design)
const DEFAULT_TURNSTILE_SITE_KEY = '0x4AAAAAAFbOm_C1nNH_sg35';

export const BACKEND_URL = String(import.meta.env.VITE_SOURCES_API_URL || DEFAULT_API_URL).replace(
  /\/$/,
  '',
);
export const TURNSTILE_SITE_KEY = String(
  import.meta.env.VITE_TURNSTILE_SITE_KEY || DEFAULT_TURNSTILE_SITE_KEY,
);
export const BACKEND_ENABLED = Boolean(BACKEND_URL && TURNSTILE_SITE_KEY);
