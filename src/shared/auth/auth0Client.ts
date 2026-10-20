import type { Auth0Client } from '@auth0/auth0-spa-js';
import { AUTH0_AUDIENCE, AUTH0_CLIENT_ID, AUTH0_DOMAIN } from '@/shared/config/auth';

let client: Promise<Auth0Client> | null = null;

/**
 * The Auth0 client, loaded only when needed (signing in, a member's request): the field app starts
 * without it. Tokens stay in localStorage with a refresh token, so the session survives closing
 * the PWA and Safari's limits on third-party cookies.
 */
export function auth0Client(): Promise<Auth0Client> {
  client ??= import('@auth0/auth0-spa-js')
    .then(
      ({ Auth0Client }) =>
        new Auth0Client({
          domain: AUTH0_DOMAIN,
          clientId: AUTH0_CLIENT_ID,
          authorizationParams: {
            redirect_uri: `${window.location.origin}${import.meta.env.BASE_URL}`,
            audience: AUTH0_AUDIENCE,
          },
          cacheLocation: 'localstorage',
          useRefreshTokens: true,
        }),
    )
    .catch((e: unknown) => {
      client = null;
      throw e;
    });
  return client;
}
