import { createId } from '@/shared/lib/createId';
import type { ContextFeature } from '@/shared/types/domain';
import type { SourceObject } from '@/shared/types/sources';

/** An accepted object of a sent source; `sourceLabel` names the source it was read from. */
export function toContextFeature(
  o: SourceObject,
  sourceLabel: string,
  at = Date.now(),
): ContextFeature {
  return {
    id: createId(),
    kind: o.kind,
    geometry: { type: 'Point', coordinates: [o.lng, o.lat] },
    source: `AI ze źródła: ${o.label} (±${o.radiusM} m)`,
    label: o.label,
    seen: [
      {
        map: { kind: 'none', label: `Źródło: ${sourceLabel}` },
        at,
        how: 'zrodlo',
        confidence: o.confidence,
      },
    ],
  };
}
