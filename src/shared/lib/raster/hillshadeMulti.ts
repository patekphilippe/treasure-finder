import { hornGradient } from './hornGradient';

/**
 * Multi-directional hillshade (0–1): the light from `azimuths` directions at the given sun
 * altitude, averaged, so no single direction hides a form. The directions span a half circle
 * centred on `centreDeg` (north-west, the cartographic convention): over the full circle every
 * slope is lit from the front as much as from the back and the average flattens to a constant.
 */
export function hillshadeMulti(
  dem: Float32Array,
  w: number,
  h: number,
  cell: number,
  azimuths = 16,
  altitudeDeg = 35,
  centreDeg = 315,
): Float32Array {
  const zen = ((90 - altitudeDeg) * Math.PI) / 180;
  const cosZen = Math.cos(zen);
  const sinZen = Math.sin(zen);
  const dirs = Array.from({ length: azimuths }, (_, k) => {
    // clockwise from north, evenly over centre ± 90°
    const az = ((centreDeg - 90 + (180 * (k + 0.5)) / azimuths) * Math.PI) / 180;
    return [Math.sin(az), Math.cos(az)] as const; // east and north components
  });
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const [dx, dy] = hornGradient(dem, w, h, cell, x, y);
      const g = Math.hypot(dx, dy);
      const cosSlope = 1 / Math.sqrt(1 + g * g);
      const sinSlope = g * cosSlope;
      // the surface faces downhill: (−dx, −dy) normalised
      const ux = g ? -dx / g : 0;
      const uy = g ? -dy / g : 0;
      let sum = 0;
      for (const [ex, ny] of dirs)
        sum += Math.max(0, cosZen * cosSlope + sinZen * sinSlope * (ex * ux + ny * uy));
      out[y * w + x] = sum / azimuths;
    }
  return out;
}
