import type { Component } from './components';

/** Chamfer (3-4) distance in cells from every cell of a window to the nearest cell of `cells`. */
export function distanceToCells(
  cells: Int32Array,
  w: number,
  win: { row0: number; col0: number; rows: number; cols: number },
): Float32Array {
  const { row0, col0, rows, cols } = win;
  const INF = 1e9;
  const d = new Float32Array(rows * cols).fill(INF);
  for (const i of cells) {
    const y = ((i / w) | 0) - row0;
    const x = (i % w) - col0;
    if (y >= 0 && y < rows && x >= 0 && x < cols) d[y * cols + x] = 0;
  }
  const at = (x: number, y: number) =>
    x >= 0 && x < cols && y >= 0 && y < rows ? d[y * cols + x]! : INF;
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const k = y * cols + x;
      d[k] = Math.min(
        d[k]!,
        at(x - 1, y) + 3,
        at(x, y - 1) + 3,
        at(x - 1, y - 1) + 4,
        at(x + 1, y - 1) + 4,
      );
    }
  for (let y = rows - 1; y >= 0; y--)
    for (let x = cols - 1; x >= 0; x--) {
      const k = y * cols + x;
      d[k] = Math.min(
        d[k]!,
        at(x + 1, y) + 3,
        at(x, y + 1) + 3,
        at(x + 1, y + 1) + 4,
        at(x - 1, y + 1) + 4,
      );
    }
  for (let k = 0; k < d.length; k++) d[k] = d[k]! / 3;
  return d;
}

/** Window around a component with a margin, clipped to the grid. */
export function windowAround(c: Component, w: number, h: number, marginCells: number) {
  const row0 = Math.max(0, c.row0 - marginCells);
  const col0 = Math.max(0, c.col0 - marginCells);
  const row1 = Math.min(h - 1, c.row1 + marginCells);
  const col1 = Math.min(w - 1, c.col1 + marginCells);
  return { row0, col0, rows: row1 - row0 + 1, cols: col1 - col0 + 1 };
}

/** Least-squares plane z = a·x + b·y + c (x east, y north, metres). */
export interface Plane {
  a: number;
  b: number;
  c: number;
}

export function fitPlane(xs: number[], ys: number[], zs: number[]): Plane | null {
  const n = zs.length;
  if (n < 3) return null;
  let sx = 0, sy = 0, sz = 0; // prettier-ignore
  for (let i = 0; i < n; i++) {
    sx += xs[i]!;
    sy += ys[i]!;
    sz += zs[i]!;
  }
  const mx = sx / n;
  const my = sy / n;
  const mz = sz / n;
  let xx = 0, yy = 0, xy = 0, xz = 0, yz = 0; // prettier-ignore
  for (let i = 0; i < n; i++) {
    const x = xs[i]! - mx;
    const y = ys[i]! - my;
    const z = zs[i]! - mz;
    xx += x * x;
    yy += y * y;
    xy += x * y;
    xz += x * z;
    yz += y * z;
  }
  const det = xx * yy - xy * xy;
  if (Math.abs(det) < 1e-12) return { a: 0, b: 0, c: mz };
  const a = (xz * yy - yz * xy) / det;
  const b = (yz * xx - xz * xy) / det;
  return { a, b, c: mz - a * mx - b * my };
}

export const planeAt = (p: Plane, x: number, y: number) => p.a * x + p.b * y + p.c;

/** Monotone-chain convex hull of 2D points (counter-clockwise, no repeated first point). */
export function convexHull(pts: [number, number][]): [number, number][] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, q) <= 0)
      lower.pop();
    lower.push(q);
  }
  const upper: [number, number][] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i]!;
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, q) <= 0)
      upper.pop();
    upper.push(q);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

export function pointInRing(x: number, y: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Sector index 0…n−1 of an angle (radians from east, CCW); sector 0 is centred on east. */
export function sectorOf(angle: number, n: number): number {
  const step = (2 * Math.PI) / n;
  return ((Math.round(angle / step) % n) + n) % n;
}

export const sectorAngle = (k: number, n: number) => (k * 2 * Math.PI) / n;

/** Smallest angle between two directions, radians 0…π. */
export function angleDiff(a: number, b: number): number {
  const d = Math.abs(((a - b) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return d > Math.PI ? 2 * Math.PI - d : d;
}

/** Polish compass word for a direction (radians from east, CCW). */
export function compassPl(angle: number): string {
  const names = [
    'wschodniej',
    'północno-wschodniej',
    'północnej',
    'północno-zachodniej',
    'zachodniej',
    'południowo-zachodniej',
    'południowej',
    'południowo-wschodniej',
  ];
  return names[sectorOf(angle, 8)]!;
}
