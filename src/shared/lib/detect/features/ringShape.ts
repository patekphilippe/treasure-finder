import type { Component } from '../components';
import { convexHull, pointInRing, sectorAngle, sectorOf } from '../geom';
import { interpretConfig } from '../interpretConfig';

export interface RingShape {
  /** share of the convex hull not covered by the wall */
  innerShare: number;
  /** sectors (of 8) around the inner area that contain wall */
  coveredSectors: number;
  /** direction of the gap (radians from east, CCW); null when closed */
  openingDir: number | null;
  /** inner area centroid, cells */
  row: number;
  col: number;
}

/** Wall around an inner area: closed ring, horseshoe or neither. */
export function ringShape(c: Component, w: number, cfg = interpretConfig): RingShape {
  const pts: [number, number][] = [];
  const inComp = new Set<number>();
  for (const i of c.cells) {
    pts.push([i % w, (i / w) | 0]);
    inComp.add(i);
  }
  const hull = convexHull(pts);
  let inner = 0;
  let sr = 0;
  let sc = 0;
  for (let row = c.row0; row <= c.row1; row++)
    for (let col = c.col0; col <= c.col1; col++) {
      if (inComp.has(row * w + col) || !pointInRing(col, row, hull)) continue;
      inner++;
      sr += row;
      sc += col;
    }
  const innerShare = inner / (inner + c.cells.length);
  if (inner === 0) return { innerShare: 0, coveredSectors: 0, openingDir: null, row: 0, col: 0 };
  const row = sr / inner;
  const col = sc / inner;
  const n = cfg.spoil.sectors;
  const counts = new Array<number>(n).fill(0);
  for (const i of c.cells)
    counts[sectorOf(Math.atan2(-(((i / w) | 0) - row), (i % w) - col), n)]!++;
  const minCount = Math.max(2, 0.03 * c.cells.length);
  const covered = counts.map((k) => k >= minCount);
  const coveredSectors = covered.filter(Boolean).length;
  let gx = 0;
  let gy = 0;
  covered.forEach((on, k) => {
    if (!on) {
      gx += Math.cos(sectorAngle(k, n));
      gy += Math.sin(sectorAngle(k, n));
    }
  });
  const openingDir = coveredSectors < n && Math.hypot(gx, gy) > 1e-9 ? Math.atan2(gy, gx) : null;
  return { innerShare, coveredSectors, openingDir, row, col };
}
