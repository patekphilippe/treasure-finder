import { crsTransform, fromEpsg2180, toEpsg2180 } from '@/shared/lib/geo';
import { applyHomography, invertHomography } from '@/shared/lib/georef';
import type { OwnMap } from '@/shared/types/domain';

/**
 * Where a point read on an own map goes when the map is placed anew: the same spot of the image
 * under the new placement. Longitude and latitude in and out; null for a map in an unknown system.
 */
export function mapPointMover(
  before: OwnMap,
  after: OwnMap,
): ((lng: number, lat: number) => [number, number]) | null {
  const from = crsTransform(before.epsg);
  const to = crsTransform(after.epsg);
  if (!from || !to) return null;
  const toPixel = invertHomography(before.pixelToSource);
  return (lng, lat) => {
    const [e, n] = toEpsg2180(lat, lng);
    const [sx, sy] = from.from2180(e, n);
    const pixel = applyHomography(toPixel, { x: sx, y: sy });
    const s = applyHomography(after.pixelToSource, pixel);
    const [e2, n2] = to.to2180(s.x, s.y);
    const [lat2, lng2] = fromEpsg2180(e2, n2);
    return [lng2, lat2];
  };
}
