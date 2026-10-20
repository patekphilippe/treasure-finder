import { toPuwg92 } from '@/shared/lib/geo/toPuwg92';
import { RELIEF_TILE_PX } from './config';

/** Lattice steps per tile side: exact positions every 32 px, bilinear in between (< 0.01 px off). */
export const LATTICE_STEPS = 16;
/** DEM cells around the tile, so the 3×3 gradient has neighbours at the edge. */
const MARGIN_CELLS = 2;
/** The NMT is a 1 m grid: asking finer only interpolates. */
const NATIVE_CELL_M = 1;

export interface DemWindow {
  /** west and north edge of the grid, EPSG:2180 metres */
  e0: number;
  n1: number;
  cell: number;
  w: number;
  h: number;
  /** EPSG:2180 (easting, northing) of the (STEPS + 1)² lattice over the tile, row by row */
  lattice: Float64Array;
}

const lngOf = (x: number, n: number) => (x / n) * 360 - 180;
const latOf = (y: number, n: number) =>
  (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;

/** WGS84 bounds of a Web Mercator tile. */
export function tileBounds(z: number, x: number, y: number) {
  const n = 2 ** z;
  return { west: lngOf(x, n), east: lngOf(x + 1, n), north: latOf(y, n), south: latOf(y + 1, n) };
}

/**
 * The EPSG:2180 DEM grid a map tile is drawn from: its bounding box plus a margin, with cells
 * about the size of the tile's pixels (never finer than the 1 m NMT).
 */
export function demWindow(z: number, x: number, y: number): DemWindow {
  const n = 2 ** z;
  const lattice = new Float64Array((LATTICE_STEPS + 1) ** 2 * 2);
  let minE = Infinity;
  let maxE = -Infinity;
  let minN = Infinity;
  let maxN = -Infinity;
  for (let j = 0; j <= LATTICE_STEPS; j++)
    for (let i = 0; i <= LATTICE_STEPS; i++) {
      const [e, nn] = toPuwg92(latOf(y + j / LATTICE_STEPS, n), lngOf(x + i / LATTICE_STEPS, n));
      const k = (j * (LATTICE_STEPS + 1) + i) * 2;
      lattice[k] = e;
      lattice[k + 1] = nn;
      minE = Math.min(minE, e);
      maxE = Math.max(maxE, e);
      minN = Math.min(minN, nn);
      maxN = Math.max(maxN, nn);
    }
  // the top edge's length over the tile's pixels: the ground size of one pixel
  const top = Math.hypot(
    lattice[LATTICE_STEPS * 2]! - lattice[0]!,
    lattice[LATTICE_STEPS * 2 + 1]! - lattice[1]!,
  );
  const cell = Math.max(NATIVE_CELL_M, top / RELIEF_TILE_PX);
  const w = Math.ceil((maxE - minE) / cell) + 2 * MARGIN_CELLS;
  const h = Math.ceil((maxN - minN) / cell) + 2 * MARGIN_CELLS;
  return {
    e0: minE - MARGIN_CELLS * cell,
    n1: maxN + MARGIN_CELLS * cell,
    cell,
    w,
    h,
    lattice,
  };
}
