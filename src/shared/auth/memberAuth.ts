import { useMembership } from '@/shared/store/useMembership';
import { auth0Client } from './auth0Client';

/** Auth0 errors after which only signing in again helps */
const SESSION_GONE = new Set([
  'login_required',
  'invalid_grant',
  'missing_refresh_token',
  'consent_required',
]);

/**
 * `Authorization` of the signed-in member (Auth0 access token, renewed with the refresh token), or
 * nothing for everyone else, who pass Turnstile instead. A session Auth0 no longer knows signs out.
 */
export async function memberAuth(): Promise<Record<string, string>> {
  if (!useMembership.getState().email) return {};
  try {
    const token = await (await auth0Client()).getTokenSilently();
    return token ? { authorization: `Bearer ${token}` } : {};
  } catch (e) {
    if (SESSION_GONE.has((e as { error?: string }).error ?? '')) {
      useMembership.getState().leave();
      throw new Error('Sesja wygasła, zaloguj się ponownie do społeczności');
    }
    throw new Error('Brak połączenia z serwerem logowania');
  }
}
