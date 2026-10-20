import { useEffect, useState } from 'react';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { syncCommunity } from '../services/syncCommunity';

/**
 * Brings the view's shared objects in when a member opens the sheet (quietly: offline is fine)
 * and returns how many there are; `set` updates it after a manual refresh.
 */
export function useCommunityInView(code: string | null): [number | null, (n: number) => void] {
  const [inView, setInView] = useState<number | null>(null);
  useEffect(() => {
    const bounds = useMapViewStore.getState().bounds;
    if (!code || !bounds) return;
    let cancelled = false;
    syncCommunity(bounds)
      .then((n) => {
        if (!cancelled) setInView(n);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [code]);
  return [inView, setInView];
}
