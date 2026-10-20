import { useMemo } from 'react';
import { findHistoricalLayer, useLayersStore } from '@/features/layers';
import type { ViewSource } from '../services/captureView';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { toViewSource } from '../utils/toViewSource';

/** The historical map in view: a visible own map first, else the chosen online map. */
export function useViewSource(): ViewSource | null {
  const own = useOwnMapsStore((s) => s.maps.find((m) => m.visible));
  const layer = findHistoricalLayer(useLayersStore((s) => s.historicalId));
  const year = useLayersStore((s) => s.historicalYear);
  return useMemo(
    () => (own ? toViewSource({ own }) : layer ? toViewSource({ layer, year }) : null),
    [own, layer, year],
  );
}
