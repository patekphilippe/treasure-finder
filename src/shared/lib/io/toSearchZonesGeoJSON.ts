import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import type { Candidate } from '@/shared/types/domain';
import { INTERPRETATIONS } from '../detect/vocabulary';

/** strefy_poszukiwan.geojson: search zones with candidate id, interpretation and priority. */
export function toSearchZonesGeoJSON(
  candidates: readonly Candidate[],
): FeatureCollection<Polygon | MultiPolygon> {
  return {
    type: 'FeatureCollection',
    features: candidates
      .filter((c) => c.searchZone)
      .map((c): Feature<Polygon | MultiPolygon> => ({
        type: 'Feature',
        geometry: c.searchZone!,
        properties: {
          candidateId: c.id,
          interpretation: c.interpretation,
          nazwa: INTERPRETATIONS[c.interpretation].label,
          priority: c.priority,
          score: c.score,
          decision: c.decision,
          uxo: c.flags.uxo,
          warGraves: c.flags.warGraves,
        },
      })),
  };
}
