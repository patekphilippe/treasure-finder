import { BACKEND_ENABLED } from './backend';

/**
 * Community sign-in (Auth0, OAuth only, docs/BACKEND.md "Logowanie"). Both values are public (the
 * browser sees them anyway); a build may override them. Empty: no sign-in, the community is hidden.
 */
const DEFAULT_AUTH0_DOMAIN = '';
const DEFAULT_AUTH0_CLIENT_ID = '';

export const AUTH0_DOMAIN = String(import.meta.env.VITE_AUTH0_DOMAIN || DEFAULT_AUTH0_DOMAIN);
export const AUTH0_CLIENT_ID = String(
  import.meta.env.VITE_AUTH0_CLIENT_ID || DEFAULT_AUTH0_CLIENT_ID,
);
/** identifier of the worker's API in Auth0 (AUTH0_AUDIENCE in server/wrangler.toml) */
export const AUTH0_AUDIENCE = 'https://treasure-finder-api';
export const AUTH_ENABLED = Boolean(BACKEND_ENABLED && AUTH0_DOMAIN && AUTH0_CLIENT_ID);
