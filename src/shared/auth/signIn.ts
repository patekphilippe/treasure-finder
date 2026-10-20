import { useFieldStore } from '@/shared/store/useFieldStore';
import { auth0Client } from './auth0Client';

/**
 * Goes to Auth0 to sign in with an OAuth provider (Google; no passwords) and comes back to
 * `returnTo`, a hash such as `#admin`. It leaves the app for a moment, so not while recording.
 */
export async function signIn(returnTo = '', emailHint?: string): Promise<void> {
  if (useFieldStore.getState().recordingTrackId !== null)
    throw new Error('Najpierw zatrzymaj nagrywanie trasy: logowanie na chwilę opuszcza aplikację');
  const client = await auth0Client();
  await client.loginWithRedirect({
    // always the account choice: after signing out another account may be wanted
    authorizationParams: { prompt: 'login', ...(emailHint ? { login_hint: emailHint } : {}) },
    appState: { returnTo },
  });
}
