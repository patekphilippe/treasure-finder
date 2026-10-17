import type { MultiPolygon, Polygon } from 'geojson';

/**
 * Even-odd ray casting test for a WGS84 point against a GeoJSON (Multi)Polygon.
 * Holes are handled because every ring toggles the result.
 */
export function pointInPolygon(
  lat: number,
  lng: number,
  geometry: Polygon | MultiPolygon,
): boolean {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  let inside = false;
  for (const rings of polygons) {
    for (const ring of rings) {
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i] as [number, number];
        const [xj, yj] = ring[j] as [number, number];
        if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
          inside = !inside;
        }
      }
    }
  }
  return inside;
}
