import type { ContextFeature } from '@/shared/types/domain';

/** The objects seen only on one own map: what its reading added and no other map confirms. */
export function seenOnlyOnMap(
  features: readonly ContextFeature[],
  mapId: string,
): ContextFeature[] {
  return features.filter(
    (f) => f.seen?.length && f.seen.every((s) => s.map.kind === 'own' && s.map.id === mapId),
  );
}
