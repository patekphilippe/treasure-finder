import type { Feature, FeatureCollection, Point } from 'geojson';
import type { FieldPoint } from '@/shared/types/domain';

/** Points as GeoJSON (EPSG:4326, [lng, lat]); properties are the model fields. */
export function toPointsGeoJSON(points: readonly FieldPoint[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: points.map(({ lat, lng, ...props }): Feature<Point> => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: props,
    })),
  };
}
