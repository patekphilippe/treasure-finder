import { useMemo } from 'react';
import { HISTORICAL_LAYERS } from '@/features/layers';
import { useContextStore } from '../store/useContextStore';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { idsSeenOn } from '../utils/idsSeenOn';
import { knownMaps } from '../utils/knownMaps';
import { useViewSource } from './useViewSource';

/** Ids of the objects seen on the historical map in view; null when no such map is on. */
export function useSeenOnView(): Set<string> | null {
  const view = useViewSource();
  const features = useContextStore((s) => s.features);
  const own = useOwnMapsStore((s) => s.maps);
  return useMemo(
    () => (view ? idsSeenOn(features, view.ref, knownMaps(HISTORICAL_LAYERS, own)) : null),
    [view, features, own],
  );
}
