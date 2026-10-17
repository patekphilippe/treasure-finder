import type { Feature, FeatureCollection, Point } from 'geojson';
import type { Candidate } from '@/shared/types/domain';

export function toCandidatesGeoJSON(candidates: readonly Candidate[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: candidates.map(({ lat, lng, ...props }): Feature<Point> => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: props,
    })),
  };
}
