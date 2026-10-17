export interface XY {
  x: number;
  y: number;
}

/** 2D affine map x' = a·x + c·y + e, y' = b·x + d·y + f (canvas setTransform order). */
export interface Affine {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

/**
 * Affine map from projected metres to tile pixels, given where three tile pixels
 * land in metres: (0,0) → p0, (size,0) → p1, (0,size) → p2. Across one map tile the
 * EPSG:2180 ↔ Web Mercator relation is a rotation + scale to well under a pixel.
 */
export function metresToTilePixels(p0: XY, p1: XY, p2: XY, size: number): Affine {
  // forward: metres = p0 + U·u + V·v, with U, V the metre steps per pixel
  const ux = (p1.x - p0.x) / size;
  const uy = (p1.y - p0.y) / size;
  const vx = (p2.x - p0.x) / size;
  const vy = (p2.y - p0.y) / size;
  const det = ux * vy - vx * uy;
  // inverse of [[ux, vx], [uy, vy]]
  const a = vy / det;
  const c = -vx / det;
  const b = -uy / det;
  const d = ux / det;
  return { a, b, c, d, e: -(a * p0.x + c * p0.y), f: -(b * p0.x + d * p0.y) };
}

export function applyAffine(m: Affine, p: XY): XY {
  return { x: m.a * p.x + m.c * p.y + m.e, y: m.b * p.x + m.d * p.y + m.f };
}
