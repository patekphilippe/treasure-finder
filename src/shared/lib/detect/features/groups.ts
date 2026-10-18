import type { XY } from './lines';

/** Coefficient of variation of nearest-neighbour distances (0 = perfectly regular). */
export function nearestNeighbourStats(pts: readonly XY[]): { mean: number; cv: number } {
  if (pts.length < 2) return { mean: 0, cv: 1 };
  const d = pts.map((p, i) =>
    Math.min(...pts.filter((_, j) => j !== i).map((q) => Math.hypot(q[0] - p[0], q[1] - p[1]))),
  );
  const mean = d.reduce((a, b) => a + b, 0) / d.length;
  const sd = Math.sqrt(d.reduce((a, b) => a + (b - mean) ** 2, 0) / d.length);
  return { mean, cv: mean ? sd / mean : 1 };
}

/** PCA of points: minor / major eigenvalue (0 = on one line) and the major axis direction. */
export function linearity(pts: readonly XY[]): { ratio: number; axis: number } {
  const n = pts.length;
  if (n < 2) return { ratio: 1, axis: 0 };
  const mx = pts.reduce((a, p) => a + p[0], 0) / n;
  const my = pts.reduce((a, p) => a + p[1], 0) / n;
  let xx = 0, yy = 0, xy = 0; // prettier-ignore
  for (const [x, y] of pts) {
    xx += (x - mx) ** 2;
    yy += (y - my) ** 2;
    xy += (x - mx) * (y - my);
  }
  const half = Math.sqrt(((xx - yy) / 2) ** 2 + xy * xy);
  const l1 = (xx + yy) / 2 + half;
  const l2 = (xx + yy) / 2 - half;
  return { ratio: l1 > 0 ? Math.max(0, l2) / l1 : 1, axis: 0.5 * Math.atan2(2 * xy, xx - yy) };
}

/** Circular variance of directions: 0 = all the same, 1 = spread evenly. */
export function circularVariance(angles: readonly number[]): number {
  if (angles.length === 0) return 1;
  const c = angles.reduce((a, t) => a + Math.cos(t), 0);
  const s = angles.reduce((a, t) => a + Math.sin(t), 0);
  return 1 - Math.hypot(c, s) / angles.length;
}

export const circularMean = (angles: readonly number[]) =>
  Math.atan2(
    angles.reduce((a, t) => a + Math.sin(t), 0),
    angles.reduce((a, t) => a + Math.cos(t), 0),
  );

/** Single-linkage clusters: indices of points linked by steps of at most `link` metres. */
export function clusters(pts: readonly XY[], link: number): number[][] {
  const seen = new Array<boolean>(pts.length).fill(false);
  const out: number[][] = [];
  for (let s = 0; s < pts.length; s++) {
    if (seen[s]) continue;
    const group = [s];
    seen[s] = true;
    for (let k = 0; k < group.length; k++) {
      const p = pts[group[k]!]!;
      pts.forEach((q, j) => {
        if (!seen[j] && Math.hypot(q[0] - p[0], q[1] - p[1]) <= link) {
          seen[j] = true;
          group.push(j);
        }
      });
    }
    out.push(group);
  }
  return out;
}

export const centroid = (pts: readonly XY[]): XY => [
  pts.reduce((a, p) => a + p[0], 0) / pts.length,
  pts.reduce((a, p) => a + p[1], 0) / pts.length,
];
