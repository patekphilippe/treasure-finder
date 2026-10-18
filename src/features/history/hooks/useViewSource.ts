import { findHistoricalLayer, useLayersStore } from '@/features/layers';
import type { ViewSource } from '../services/captureView';
import { useOwnMapsStore } from '../store/useOwnMapsStore';

/** The historical map the reading looks at: a visible own map first, else the chosen online map. */
export function useViewSource(): ViewSource | null {
  const own = useOwnMapsStore((s) => s.maps.find((m) => m.visible));
  const layer = findHistoricalLayer(useLayersStore((s) => s.historicalId));
  const year = useLayersStore((s) => s.historicalYear);
  if (own) return { kind: 'own', map: own, label: `${own.name} (własna mapa)` };
  if (layer)
    return {
      kind: 'wms',
      layer,
      year,
      label: layer.yearRange ? `${layer.label} ${year}` : `${layer.label} (${layer.years})`,
    };
  return null;
}
