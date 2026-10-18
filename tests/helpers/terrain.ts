import type { DemGrid } from '@/shared/lib/raster';

/**
 * Synthetic terrain from the specification: 200 × 200 cells of 1 m on a plane tilted 2°
 * (rising to the east) with 0.03 m Gaussian noise. Coordinates: x east, y SOUTH (= row),
 * metres from the top-left corner, so (x, y) = (col + 0.5, row + 0.5).
 */
export const N = 200;
export const ORIGIN_E = 400_000;
export const ORIGIN_N = 500_000;
const SLOPE = Math.tan((2 * Math.PI) / 180);

export class Terrain {
  readonly z = new Float32Array(N * N);

  constructor(noise = 0.03, seed = 7) {
    let s = seed;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let row = 0; row < N; row++)
      for (let col = 0; col < N; col++) {
        const g = Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
        this.z[row * N + col] = 150 + SLOPE * (col + 0.5) + noise * g;
      }
  }

  /** Plane elevation (without noise and features) at a point. */
  plane(x: number): number {
    return 150 + SLOPE * x;
  }

  each(f: (x: number, y: number, i: number) => void) {
    for (let row = 0; row < N; row++)
      for (let col = 0; col < N; col++) f(col + 0.5, row + 0.5, row * N + col);
  }

  add(f: (x: number, y: number) => number): this {
    this.each((x, y, i) => (this.z[i]! += f(x, y)));
    return this;
  }

  grid(): DemGrid {
    return { w: N, h: N, cell: 1, originE: ORIGIN_E, originN: ORIGIN_N, dem: this.z };
  }
}

const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/** Cone-shaped pit (crater). */
export const cone =
  (cx: number, cy: number, diameter: number, depth: number) => (x: number, y: number) =>
    -depth * Math.max(0, 1 - Math.hypot(x - cx, y - cy) / (diameter / 2));

/** Raised ring (rim / wall) with a rounded profile between radii rIn and rOut. */
export const rim =
  (cx: number, cy: number, rIn: number, rOut: number, height: number) => (x: number, y: number) => {
    const r = Math.hypot(x - cx, y - cy);
    if (r < rIn || r > rOut) return 0;
    return height * Math.sin((Math.PI * (r - rIn)) / (rOut - rIn));
  };

/** Dome (raised cosine): barrow. */
export const dome =
  (cx: number, cy: number, diameter: number, height: number) => (x: number, y: number) => {
    const r = Math.hypot(x - cx, y - cy) / (diameter / 2);
    return r >= 1 ? 0 : (height * (1 + Math.cos(Math.PI * r))) / 2;
  };

/** Small mound next to a pit, as left by a root plate or a spoil heap. */
export const mound = (cx: number, cy: number, diameter: number, height: number) =>
  dome(cx, cy, diameter, height);

/** Flat-bottomed rectangular pit (dugout), axis-aligned. */
export const rectPit =
  (cx: number, cy: number, lx: number, ly: number, depth: number) => (x: number, y: number) =>
    Math.abs(x - cx) <= lx / 2 && Math.abs(y - cy) <= ly / 2 ? -depth : 0;

/** Narrow notch from (x0, y) to (x1, y), depth falling linearly from d0 to d1. */
export const notchX =
  (x0: number, x1: number, y: number, width: number, d0: number, d1: number) =>
  (x: number, yy: number) => {
    if (Math.abs(yy - y) > width / 2 || x < Math.min(x0, x1) || x > Math.max(x0, x1)) return 0;
    const t = (x - x0) / (x1 - x0);
    return -(d0 + (d1 - d0) * t);
  };

/** Distance from (x, y) to a polyline, plus the signed side (+ left of travel, − right). */
export function toPolyline(x: number, y: number, pts: [number, number][]) {
  let best = Infinity;
  let side = 0;
  let along = 0;
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1]!;
    const [bx, by] = pts[i]!;
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy);
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (len * len)));
    const d = Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
    if (d < best) {
      best = d;
      side = Math.sign(dx * (y - ay) - dy * (x - ax));
      along = acc + t * len;
    }
    acc += len;
  }
  return { d: best, side, along };
}

/** Trench along a polyline; parapet bank on one side (+1 / −1 relative to travel, 0 = none). */
export const trench =
  (
    pts: [number, number][],
    width: number,
    depth: number,
    parapetSide: number,
    parapetHeight = 0.4,
  ) =>
  (x: number, y: number) => {
    const { d, side } = toPolyline(x, y, pts);
    if (d <= width / 2) return -depth;
    if (parapetSide && side === parapetSide && d > width / 2 + 0.5 && d < width / 2 + 3.5)
      return parapetHeight * Math.sin((Math.PI * (d - width / 2 - 0.5)) / 3);
    return 0;
  };

/** Wide shallow valley (stream hollow) along x = cx. */
export const valley = (cx: number, width: number, depth: number) => (x: number) =>
  -depth * smooth(1 - Math.abs(x - cx) / (width / 2));

/** Horseshoe wall around (cx, cy), open towards `openDir` (radians, map convention: 0 east, π/2 north). */
export const horseshoe =
  (
    cx: number,
    cy: number,
    diameter: number,
    wallWidth: number,
    height: number,
    openDir: number,
    gapDeg = 90,
  ) =>
  (x: number, y: number) => {
    const ang = Math.atan2(-(y - cy), x - cx);
    let diff = Math.abs(ang - openDir) % (2 * Math.PI);
    if (diff > Math.PI) diff = 2 * Math.PI - diff;
    if (diff < ((gapDeg / 2) * Math.PI) / 180) return 0;
    const r = Math.hypot(x - cx, y - cy);
    const rOut = diameter / 2;
    return rim(cx, cy, rOut - wallWidth, rOut, height)(x, y) && r <= rOut
      ? rim(cx, cy, rOut - wallWidth, rOut, height)(x, y)
      : 0;
  };

/** Parallel ridges (old field strips) running north–south, `period` apart, peak-to-peak `height`. */
export const ridges =
  (x0: number, x1: number, y0: number, y1: number, period: number, height: number) =>
  (x: number, y: number) =>
    x >= x0 && x <= x1 && y >= y0 && y <= y1
      ? (height / 2) * Math.sin((2 * Math.PI * x) / period)
      : 0;

/** Seeded uniform random numbers for scattered features. */
export function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
