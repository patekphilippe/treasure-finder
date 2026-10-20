import { HISTORICAL_LAYERS } from '@/features/layers';
import { mergeSighting } from '@/shared/lib/history';
import type { ContextFeature } from '@/shared/types/domain';
import { SAME_MAP_DUPLICATE_M, SAME_OBJECT_M } from '../config/contextKinds';
import { useContextStore } from '../store/useContextStore';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { knownMaps } from '../utils/knownMaps';
import { sightingsOf } from '../utils/sightingsOf';

export interface AddedCounts {
  added: number;
  /** objects that were already there and got the new map */
  merged: number;
  /** already there on the same map: nothing added */
  duplicates: number;
}

/**
 * Adds archival objects to the one shared layer: an object already there (seen on another map) gets
 * the new map instead of a twin, one seen again on the same map is skipped. One write, so
 * the analysis is recomputed once.
 */
export async function addSightedObjects(incoming: readonly ContextFeature[]): Promise<AddedCounts> {
  const known = knownMaps(HISTORICAL_LAYERS, useOwnMapsStore.getState().maps);
  const opts = {
    mergeM: SAME_OBJECT_M,
    duplicateM: SAME_MAP_DUPLICATE_M,
    sightingsOf: (f: ContextFeature) => sightingsOf(f, known),
  };
  const working = [...useContextStore.getState().features];
  const changed = new Map<string, ContextFeature>();
  const counts: AddedCounts = { added: 0, merged: 0, duplicates: 0 };
  for (const f of incoming) {
    const r = mergeSighting(working, f, opts);
    if (r.result === 'duplicate') {
      counts.duplicates++;
      continue;
    }
    if (r.result === 'new') counts.added++;
    else counts.merged++;
    const i = working.findIndex((w) => w.id === r.feature.id);
    if (i >= 0) working[i] = r.feature;
    else working.push(r.feature);
    changed.set(r.feature.id, r.feature);
  }
  if (changed.size > 0) await useContextStore.getState().add([...changed.values()]);
  return counts;
}
