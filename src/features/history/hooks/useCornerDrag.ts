import type L from 'leaflet';
import { useCallback, useRef } from 'react';
import { toEpsg2180 } from '@/shared/lib/geo';
import { useOwnMapsStore } from '../store/useOwnMapsStore';

/** Redrawing the warped image is heavy on phones: at most ~12 updates a second while dragging. */
const MIN_INTERVAL_MS = 80;

/** Drag handler for corner `i`: throttled while dragging, always applied when dropped. */
export function useCornerDrag(): (i: number, e: L.LeafletEvent, dropped: boolean) => void {
  const last = useRef(0);
  return useCallback((i, e, dropped) => {
    const now = performance.now();
    if (!dropped && now - last.current < MIN_INTERVAL_MS) return;
    last.current = now;
    const ll = (e.target as L.Marker).getLatLng();
    const [x, y] = toEpsg2180(ll.lat, ll.lng);
    useOwnMapsStore.getState().moveCorner(i, { x, y });
  }, []);
}
