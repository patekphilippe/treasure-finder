import { createId } from '@/shared/lib/createId';
import type { ContextFeature } from '@/shared/types/domain';
import type { Proposal } from '../services/findLostBuildings';

/** An accepted AI proposal as a context object: a line keeps its course, the rest is a point. */
export function proposalToContext(p: Proposal): ContextFeature {
  return {
    id: createId(),
    kind: p.kind,
    geometry: p.line
      ? { type: 'LineString', coordinates: p.line.map(([lat, lng]) => [lng, lat]) }
      : { type: 'Point', coordinates: [p.lng, p.lat] },
    source: p.source,
  };
}
