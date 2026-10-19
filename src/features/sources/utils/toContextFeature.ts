import { createId } from '@/shared/lib/createId';
import type { ContextFeature } from '@/shared/types/domain';
import type { SourceObject } from '@/shared/types/sources';

export function toContextFeature(o: SourceObject): ContextFeature {
  return {
    id: createId(),
    kind: o.kind,
    geometry: { type: 'Point', coordinates: [o.lng, o.lat] },
    source: `AI ze źródła: ${o.label} (±${o.radiusM} m)`,
  };
}
