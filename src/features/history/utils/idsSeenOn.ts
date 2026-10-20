import { sameMap, type KnownMap } from '@/shared/lib/history';
import type { ContextFeature, MapRef } from '@/shared/types/domain';
import { sightingsOf } from './sightingsOf';

/** The objects seen on a map (an older object: as its description says). */
export function idsSeenOn(
  features: readonly ContextFeature[],
  map: MapRef,
  known: readonly KnownMap[],
): Set<string> {
  return new Set(
    features.filter((f) => sightingsOf(f, known).some((s) => sameMap(s.map, map))).map((f) => f.id),
  );
}
