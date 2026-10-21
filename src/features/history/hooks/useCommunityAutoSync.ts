import { useEffect } from 'react';
import { BACKEND_ENABLED } from '@/shared/config/backend';
import { useMapViewStore, type Bounds } from '@/shared/store/useMapViewStore';
import { useMembership } from '@/shared/store/useMembership';
import { syncCommunity } from '../services/syncCommunity';

/** the map has to rest this long before the view's shared objects are fetched */
const SETTLE_MS = 1500;
/** the same area is not fetched again within a minute */
const FRESH_MS = 60_000;

const within = (outer: Bounds, inner: Bounds) =>
  inner.south >= outer.south &&
  inner.north <= outer.north &&
  inner.west >= outer.west &&
  inner.east <= outer.east;

/**
 * A signed-in member sees the shared base without asking: at start and whenever the map comes
 * to rest, the objects of the view are brought in (quietly; offline nothing happens).
 */
export function useCommunityAutoSync(): void {
  const email = useMembership((s) => s.email);
  useEffect(() => {
    if (!email || !BACKEND_ENABLED) return;
    let timer: number | undefined;
    let last: { bounds: Bounds; at: number } | null = null;
    const schedule = (bounds: Bounds | null) => {
      window.clearTimeout(timer);
      if (!bounds) return;
      timer = window.setTimeout(() => {
        if (last && Date.now() - last.at < FRESH_MS && within(last.bounds, bounds)) return;
        last = { bounds, at: Date.now() };
        syncCommunity(bounds).catch(() => {
          last = null;
        });
      }, SETTLE_MS);
    };
    schedule(useMapViewStore.getState().bounds);
    const unsubscribe = useMapViewStore.subscribe((s, prev) => {
      if (s.bounds !== prev.bounds) schedule(s.bounds);
    });
    return () => {
      unsubscribe();
      window.clearTimeout(timer);
    };
  }, [email]);
}
