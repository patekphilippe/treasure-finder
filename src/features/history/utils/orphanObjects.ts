import type { ContextFeature } from '@/shared/types/domain';

/**
 * Objects read from own maps that are all gone (removed before their objects went with them).
 * Objects of other maps, marked by hand or with no sightings stay.
 */
export function orphanObjects(
  features: readonly ContextFeature[],
  mapIds: ReadonlySet<string>,
): ContextFeature[] {
  return features.filter(
    (f) => f.seen?.length && f.seen.every((s) => s.map.kind === 'own' && !mapIds.has(s.map.id)),
  );
}
