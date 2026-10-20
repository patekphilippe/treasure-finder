import { useEffect } from 'react';
import { isAuthCallback } from '@/shared/auth/isAuthCallback';
import { signIn } from '@/shared/auth/signIn';
import { AUTH_ENABLED } from '@/shared/config/auth';
import { useMembership } from '@/shared/store/useMembership';
import { useToastStore } from '@/shared/ui';
import { finishSignIn } from '../services/finishSignIn';
import { invitationFromHash } from '../utils/invitationFromHash';

/**
 * Coming back from Auth0 finishes the sign-in; opening an invitation link (`#zaproszenie=<adres>`,
 * also the old `#dolacz=…`) starts it. Both leave the address bar clean.
 */
export function useCommunitySignIn(): void {
  useEffect(() => {
    const toast = useToastStore.getState().show;
    const failed = (e: unknown) =>
      toast(e instanceof Error ? e.message : 'Nie udało się zalogować');
    const { href, pathname, search, hash } = window.location;
    if (AUTH_ENABLED && isAuthCallback(search)) {
      history.replaceState(null, '', pathname + hash);
      finishSignIn(href)
        .then((name) => toast(`Witaj w społeczności, ${name}`))
        .catch(failed);
      return;
    }
    const invited = invitationFromHash(hash);
    if (invited === null) return;
    history.replaceState(null, '', pathname + search);
    if (!AUTH_ENABLED) return;
    if (useMembership.getState().email) toast('Jesteś już w społeczności');
    else signIn('', invited || undefined).catch(failed);
  }, []);
}
