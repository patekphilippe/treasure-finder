import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import type { Zone } from '@/shared/types/domain';

export function toZonesGeoJSON(zones: readonly Zone[]): FeatureCollection<Polygon | MultiPolygon> {
  return {
    type: 'FeatureCollection',
    features: zones.map(({ geometry, ...props }): Feature<Polygon | MultiPolygon> => ({
      type: 'Feature',
      geometry,
      properties: props,
    })),
  };
}
