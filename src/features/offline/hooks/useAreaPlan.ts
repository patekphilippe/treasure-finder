import { useDeferredValue, useMemo } from 'react';
import { canvasDpr } from '@/shared/lib/tiles';
import { useOfflineStore } from '../store/useOfflineStore';
import { planAreaTiles, type AreaPlan } from '../utils/planAreaTiles';

/** Tiles of the framed area for the chosen layers, recounted as the map moves. */
export function useAreaPlan(): { plan: AreaPlan | null; layerNames: string[] } {
  const selection = useDeferredValue(useOfflineStore((s) => s.selection));
  const layers = useOfflineStore((s) => s.layers);

  return useMemo(() => {
    const layerNames = [
      ...(layers.ortho ? ['Zdjęcia'] : []),
      ...(layers.nmt ? ['Rzeźba terenu'] : []),
    ];
    if (!selection || layerNames.length === 0) return { plan: null, layerNames };
    const plan = planAreaTiles(selection, { ortho: layers.ortho, nmt: layers.nmt }, canvasDpr());
    return { plan, layerNames };
  }, [selection, layers]);
}
