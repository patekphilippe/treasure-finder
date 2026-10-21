import { useMemo } from 'react';
import { findHistoricalLayer, useLayersStore } from '@/features/layers';
import type { ViewSource } from '../services/captureView';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { shownMaps } from '../utils/shownMaps';
import { toViewSource } from '../utils/toViewSource';

/** The historical map in view: an own map on the map first (slider year or switch), else the chosen online map. */
export function useViewSource(): ViewSource | null {
  const own = useOwnMapsStore((s) => shownMaps(s.maps, s.years)[0]);
  const layer = findHistoricalLayer(useLayersStore((s) => s.historicalId));
  const year = useLayersStore((s) => s.historicalYear);
  return useMemo(
    () => (own ? toViewSource({ own }) : layer ? toViewSource({ layer, year }) : null),
    [own, layer, year],
  );
}
