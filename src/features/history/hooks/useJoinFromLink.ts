import { useEffect } from 'react';
import { useToastStore } from '@/shared/ui';
import { joinCommunity } from '../services/joinCommunity';
import { joinCodeFromHash } from '../utils/joinCodeFromHash';

/** Opening the invitation link `…/#dolacz=<kod>` joins the community; the code leaves the address. */
export function useJoinFromLink(): void {
  useEffect(() => {
    const code = joinCodeFromHash(window.location.hash);
    if (!code) return;
    history.replaceState(null, '', window.location.pathname + window.location.search);
    joinCommunity(code)
      .then((name) => useToastStore.getState().show(`Witaj w społeczności, ${name}`))
      .catch((e: unknown) =>
        useToastStore
          .getState()
          .show(e instanceof Error ? e.message : 'Nie udało się dołączyć do społeczności'),
      );
  }, []);
}
