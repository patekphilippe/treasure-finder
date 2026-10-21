import { useEffect } from 'react';
import { useMembership } from '@/shared/store/useMembership';
import { syncSharedMaps } from '../services/syncSharedMaps';

/** coming back to the app checks again at most this often */
const AGAIN_MS = 60_000;

/** The community's maps come by themselves: at start (signed in) and whenever the app is back on screen. */
export function useSharedMapsSync(): void {
  const email = useMembership((s) => s.email);
  useEffect(() => {
    if (!email) return;
    let last = 0;
    const sync = () => {
      if (document.visibilityState !== 'visible' || Date.now() - last < AGAIN_MS) return;
      last = Date.now();
      syncSharedMaps().catch(() => {
        last = 0;
      });
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, [email]);
}
