import { createId } from '@/shared/lib/createId';
import type { ContextFeature, Sighting } from '@/shared/types/domain';
import type { ContextKind } from '../config/contextKinds';

export function createContextPoint(
  kind: ContextKind,
  lat: number,
  lng: number,
  source: string,
  seen: Sighting[],
): ContextFeature {
  return {
    id: createId(),
    kind,
    geometry: { type: 'Point', coordinates: [lng, lat] },
    source,
    seen,
  };
}
