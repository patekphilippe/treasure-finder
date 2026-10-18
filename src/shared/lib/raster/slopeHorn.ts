import { hornGradient } from './hornGradient';

/** Slope in degrees by Horn's method. */
export function slopeHorn(dem: Float32Array, w: number, h: number, cell: number): Float32Array {
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const [dx, dy] = hornGradient(dem, w, h, cell, x, y);
      out[y * w + x] = (Math.atan(Math.hypot(dx, dy)) * 180) / Math.PI;
    }
  return out;
}
