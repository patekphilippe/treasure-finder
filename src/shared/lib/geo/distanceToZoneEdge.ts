import type { MultiPolygon, Polygon } from 'geojson';
import { pointInPolygon } from './pointInPolygon';

const M_PER_DEG_LAT = 110_540;

/**
 * Signed distance in metres from a point to the polygon boundary: positive inside,
 * negative outside. Local equirectangular projection — accurate for field-sized zones.
 */
export function distanceToZoneEdge(
  lat: number,
  lng: number,
  geometry: Polygon | MultiPolygon,
): number {
  const mx = 111_320 * Math.cos((lat * Math.PI) / 180);
  const rings = geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat();
  let best = Infinity;
  for (const ring of rings) {
    for (let i = 1; i < ring.length; i++) {
      const [x1, y1] = ring[i - 1] as [number, number];
      const [x2, y2] = ring[i] as [number, number];
      const ax = (x1 - lng) * mx;
      const ay = (y1 - lat) * M_PER_DEG_LAT;
      const bx = (x2 - lng) * mx;
      const by = (y2 - lat) * M_PER_DEG_LAT;
      const dx = bx - ax;
      const dy = by - ay;
      const len2 = dx * dx + dy * dy;
      const t = len2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
      best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy));
    }
  }
  return pointInPolygon(lat, lng, geometry) ? best : -best;
}
