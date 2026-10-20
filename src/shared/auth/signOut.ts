import { useMembership } from '@/shared/store/useMembership';
import { auth0Client } from './auth0Client';

/** Signs out on this device only: no trip to Auth0, the app stays open. */
export async function signOut(): Promise<void> {
  useMembership.getState().leave();
  await (await auth0Client()).logout({ openUrl: false });
}
