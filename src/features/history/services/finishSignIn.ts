import { auth0Client } from '@/shared/auth/auth0Client';
import { useMembership } from '@/shared/store/useMembership';
import { communityApi } from './communityApi';

/**
 * Back from Auth0: takes the sign-in, asks the backend for the member and remembers them; returns
 * the name. Auth0 lets in only invited addresses (its message comes as the error); an account
 * the backend does not know is signed out again.
 */
export async function finishSignIn(url: string): Promise<string> {
  const client = await auth0Client();
  const result = await client.handleRedirectCallback<{ returnTo?: string }>(url);
  try {
    const me = await communityApi.me((await client.getTokenSilently()) ?? '');
    useMembership.getState().join(me.email ?? '', me.name);
    const returnTo = 'appState' in result ? result.appState?.returnTo : undefined;
    if (returnTo) window.location.hash = returnTo;
    return me.name;
  } catch (e) {
    await client.logout({ openUrl: false });
    throw e;
  }
}
