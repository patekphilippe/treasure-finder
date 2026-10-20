import type { MapRef } from '@/shared/types/domain';

/** The same map: the same online layer (and year shown), the same own map, or the same description. */
export function sameMap(a: MapRef, b: MapRef): boolean {
  if (a.kind === 'wms' && b.kind === 'wms') return a.id === b.id && a.time === b.time;
  if (a.kind === 'own' && b.kind === 'own') return a.id === b.id;
  if (a.kind === 'none' && b.kind === 'none') return a.label === b.label;
  return false;
}
