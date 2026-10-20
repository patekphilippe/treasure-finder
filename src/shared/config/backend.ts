import { APP_HOST } from './appAddress';

/**
 * Optional backend (server/, docs/BACKEND.md): source submissions and AI map reading. Both values
 * are public (the browser sees them anyway); a build may override them, e.g. for a test worker.
 * On its own address the app reaches the backend under the same origin (`/api/`, no CORS).
 */
const ON_APP_HOST = typeof window !== 'undefined' && window.location.hostname === APP_HOST;
const DEFAULT_API_URL = ON_APP_HOST
  ? window.location.origin
  : 'https://treasure-finder-api.treasure-finder-server.workers.dev';
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

/**
 * Our hillshade tiles (server/src/relief, docs/BACKEND.md): the 16-direction shading of the 1 m
 * NMT, 512 px per map tile, rendered once on the server and kept there. Below zoom 12 the
 * Geoportal's own shading is shown: the NMT service does not return bigger windows whole.
 */
export const RELIEF_TILE_URL = BACKEND_URL ? `${BACKEND_URL}/api/relief/1/{z}/{x}/{y}` : '';
export const RELIEF_MIN_ZOOM = 12;
export const RELIEF_MAX_NATIVE_ZOOM = 16;
/** Poland with a margin, as the server renders it: no requests beyond. */
export const RELIEF_BOUNDS: [[number, number], [number, number]] = [
  [48.9, 14],
  [55, 24.3],
];
