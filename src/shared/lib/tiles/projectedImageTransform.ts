import type { Affine } from './tileAffine';

/**
 * Canvas transform drawing an image whose pixel (u, v) lies at EPSG:2180
 * (e0 + u·res, n0 − v·res) onto a tile, given the metres→tile-pixel affine `m`.
 */
export function projectedImageTransform(
  m: Affine,
  e0: number,
  n0: number,
  res: number,
  scale = 1,
): Affine {
  return {
    a: m.a * res * scale,
    b: m.b * res * scale,
    c: -m.c * res * scale,
    d: -m.d * res * scale,
    e: (m.a * e0 + m.c * n0 + m.e) * scale,
    f: (m.b * e0 + m.d * n0 + m.f) * scale,
  };
}
