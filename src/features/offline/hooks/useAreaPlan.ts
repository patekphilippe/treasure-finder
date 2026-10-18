import { useDeferredValue, useMemo } from 'react';
import { useLayersStore } from '@/features/layers';
import { canvasDpr } from '@/shared/lib/tiles';
import { useOfflineStore } from '../store/useOfflineStore';
import { downloadableLayers } from '../utils/downloadableLayers';
import { planAreaTiles, type AreaPlan } from '../utils/planAreaTiles';

/** Tiles of the framed area for the chosen layers, recounted as the map moves. */
export function useAreaPlan(): { plan: AreaPlan | null; layerNames: string[] } {
  const selection = useDeferredValue(useOfflineStore((s) => s.selection));
  const layers = useOfflineStore((s) => s.layers);
  const customLayers = useLayersStore((s) => s.customLayers);

  return useMemo(() => {
    const custom = downloadableLayers(customLayers).filter((l) => layers.custom.includes(l.id));
    const layerNames = [
      ...(layers.ortho ? ['Ortofotomapa'] : []),
      ...(layers.nmt ? ['Cieniowanie NMT'] : []),
      ...custom.map((l) => l.name),
    ];
    if (!selection || layerNames.length === 0) return { plan: null, layerNames };
    const plan = planAreaTiles(
      selection,
      { ortho: layers.ortho, nmt: layers.nmt, custom },
      canvasDpr(),
    );
    return { plan, layerNames };
  }, [selection, layers, customLayers]);
}
