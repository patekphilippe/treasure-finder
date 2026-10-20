import type { Affine, XY } from '@/shared/lib/tiles';

/** One square part of a tile and the affine map image pixels → tile pixels that draws it. */
export interface WarpCell {
  x: number;
  y: number;
  size: number;
  m: Affine;
}

/** tile pixel → image pixel, or null beyond the georeference's horizon (it turns over there) */
export type TileToImage = (x: number, y: number) => XY | null;

/** a 256 px tile split at most into 16 px parts */
const MAX_DEPTH = 4;
const MAX_ERROR_PX = 0.5;

/**
 * How to draw an own map onto one tile. Almost always one affine map fixed by three corners
 * matches the exact warp to half a pixel; where it does not (a strongly skewed placement on
 * big tiles at a low zoom) the tile is split into quarters. Parts that miss the image or lie
 * beyond the horizon stay empty, so no pieces of the scan land hundreds of km away.
 */
export function warpCells(
  toImage: TileToImage,
  tilePx: number,
  imageW: number,
  imageH: number,
): WarpCell[] {
  const cells: WarpCell[] = [];
  const visit = (x: number, y: number, s: number, depth: number) => {
    const split = () => {
      const h = s / 2;
      visit(x, y, h, depth + 1);
      visit(x + h, y, h, depth + 1);
      visit(x, y + h, h, depth + 1);
      visit(x + h, y + h, h, depth + 1);
    };
    const q = [toImage(x, y), toImage(x + s, y), toImage(x, y + s), toImage(x + s, y + s)];
    if (q.some((p) => p === null)) {
      if (depth < MAX_DEPTH) split();
      return;
    }
    const [q0, q1, q2, q3] = q as [XY, XY, XY, XY];
    // a straight-edged part is wholly outside when all its corners are past one side of the image
    const all = (test: (p: XY) => boolean) => [q0, q1, q2, q3].every(test);
    if (
      all((p) => p.x < 0) ||
      all((p) => p.x > imageW) ||
      all((p) => p.y < 0) ||
      all((p) => p.y > imageH)
    )
      return;
    // image → tile: tile = (x, y) + M · (img − q0), M maps (q1 − q0) → (s, 0), (q2 − q0) → (0, s)
    const ux = q1.x - q0.x;
    const uy = q1.y - q0.y;
    const vx = q2.x - q0.x;
    const vy = q2.y - q0.y;
    const det = ux * vy - vx * uy;
    const a = (s * vy) / det;
    const c = (-s * vx) / det;
    const b = (-s * uy) / det;
    const d = (s * ux) / det;
    const m = { a, b, c, d, e: x - (a * q0.x + c * q0.y), f: y - (b * q0.x + d * q0.y) };
    if (![a, b, c, d, m.e, m.f].every(Number.isFinite)) return;
    // the fourth corner tells how far the affine map is from the exact warp
    const error = Math.hypot(
      a * q3.x + c * q3.y + m.e - (x + s),
      b * q3.x + d * q3.y + m.f - (y + s),
    );
    if (error > MAX_ERROR_PX && depth < MAX_DEPTH) split();
    else cells.push({ x, y, size: s, m });
  };
  visit(0, 0, tilePx, 0);
  return cells;
}
