import type { CrsTransform } from '../geo/crsDefs';
import type { Affine, XY } from '../tiles';
import { applyHomography, type Homography } from './homography';

/**
 * Canvas transform drawing an own map onto one map tile: the tile's corners (EPSG:2180, top-left,
 * top-right, bottom-left) are converted exactly into the map's system and then into image pixels
 * through the inverse georeference; the three pairs fix the affine map image → tile pixels.
 * Across one tile this matches the exact warp to well under a pixel.
 */
export function imageToTileAffine(
  corners2180: readonly [XY, XY, XY],
  sourceToPixel: Homography,
  crs: CrsTransform,
  tilePx: number,
  /** for a non-square target (a whole view); defaults to a square tile */
  heightPx = tilePx,
): Affine {
  const [q0, q1, q2] = corners2180.map((c) => {
    const [x, y] = crs.from2180(c.x, c.y);
    return applyHomography(sourceToPixel, { x, y });
  }) as [XY, XY, XY];
  // forward image → tile: tile = M · (img − q0); M maps (q1 − q0) → (tilePx, 0), (q2 − q0) → (0, heightPx)
  const ux = q1.x - q0.x;
  const uy = q1.y - q0.y;
  const vx = q2.x - q0.x;
  const vy = q2.y - q0.y;
  const det = ux * vy - vx * uy;
  const a = (tilePx * vy) / det;
  const c = (-tilePx * vx) / det;
  const b = (-heightPx * uy) / det;
  const d = (heightPx * ux) / det;
  return { a, b, c, d, e: -(a * q0.x + c * q0.y), f: -(b * q0.x + d * q0.y) };
}
