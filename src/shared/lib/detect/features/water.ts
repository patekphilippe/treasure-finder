import { interpretConfig } from '../interpretConfig';
import type { LineFeatures, XY } from './lines';

/** A stream hollow seen in the DEM: a wide, long concave line. */
export function isWaterLine(
  f: Pick<LineFeatures, 'widthM' | 'lengthM'>,
  cfg = interpretConfig,
): boolean {
  return f.widthM >= cfg.water.minWidthM && f.lengthM >= cfg.water.minLengthM;
}

/** Distance from a point to the nearest water point (axes sampled every metre); Infinity without water. */
export function distanceToWater(p: XY, water: readonly XY[]): { d: number; nearest: XY | null } {
  let d = Infinity;
  let nearest: XY | null = null;
  for (const q of water) {
    const dd = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (dd < d) {
      d = dd;
      nearest = q;
    }
  }
  return { d, nearest };
}
