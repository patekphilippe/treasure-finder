import { cropMask, type Component } from '../components';
import { angleDiff, fitPlane } from '../geom';
import { interpretConfig } from '../interpretConfig';
import type { Scene } from '../scene';
import { skeletonGraph, skeletonize } from './skeleton';

/** Local metres of a sheet: x east from the left edge, y north from the top edge (≤ 0). */
export type XY = [number, number];

export interface LineFeatures {
  /** axis resampled every ~1 m, local metres */
  axis: XY[];
  lengthM: number;
  /** mean width = area / axis length (PCA width of a zigzag is its amplitude) */
  widthM: number;
  /** path length / chord */
  tortuosity: number;
  /** turns > 30° per 10 m */
  zigzagPer10m: number;
  /** where the axis turns > 30° (zigzag teeth included) */
  turns: XY[];
  /** real bends of the trench: turns > 30° of the axis smoothed over 20 m (not zigzag teeth) */
  majorTurns: XY[];
  junctions: XY[];
  endpoints: XY[];
  /** share of monotonic steps of the bottom elevation along the axis */
  monotonicShare: number;
  /** |fall| / length */
  gradient: number;
  /** steepest stretch over ~10 m */
  maxGradient: number;
  /** +1: parapet on the left of the axis direction, −1: on the right, 0: none / both */
  parapetSide: number;
  /** direction to the parapet (radians from east, CCW) at the axis middle; null without one */
  parapetDir: number | null;
  parapetRatio: number;
  /** across the ditch: share of the width deeper than 80 % of the max (U profile) */
  uShare: number;
  /** angle between the axis and the fall line, degrees 0 (down the slope) … 90 (along a contour) */
  angleToSlopeDeg: number;
}

export const toLocal = (s: Scene, i: number): XY => [
  ((i % s.w) + 0.5) * s.cell,
  -(((i / s.w) | 0) + 0.5) * s.cell,
];

function sample(s: Scene, arr: Float32Array, p: XY): number {
  const col = Math.min(s.w - 1, Math.max(0, Math.floor(p[0] / s.cell)));
  const row = Math.min(s.h - 1, Math.max(0, Math.floor(-p[1] / s.cell)));
  return arr[row * s.w + col]!;
}

function resample(pts: XY[], step: number): XY[] {
  if (pts.length < 2) return pts;
  // light smoothing removes the pixel staircase
  const sm = pts.map((_, k) => {
    const a = pts[Math.max(0, k - 1)]!;
    const b = pts[k]!;
    const c = pts[Math.min(pts.length - 1, k + 1)]!;
    return [(a[0] + 2 * b[0] + c[0]) / 4, (a[1] + 2 * b[1] + c[1]) / 4] as XY;
  });
  const out: XY[] = [sm[0]!];
  let carry = 0;
  for (let k = 1; k < sm.length; k++) {
    const [ax, ay] = sm[k - 1]!;
    const [bx, by] = sm[k]!;
    const len = Math.hypot(bx - ax, by - ay);
    let t = step - carry;
    while (t <= len) {
      out.push([ax + ((bx - ax) * t) / len, ay + ((by - ay) * t) / len]);
      t += step;
    }
    carry = (carry + len) % step;
  }
  const last = sm[sm.length - 1]!;
  if (Math.hypot(last[0] - out[out.length - 1]![0], last[1] - out[out.length - 1]![1]) > step / 2)
    out.push(last);
  return out;
}

const heading = (a: XY, b: XY) => Math.atan2(b[1] - a[1], b[0] - a[0]);

export function lineFeatures(s: Scene, c: Component, cfg = interpretConfig): LineFeatures {
  const L = cfg.lines;
  const crop = cropMask(c, s.w, 1);
  const sk = skeletonize(crop.mask, crop.cw, crop.ch);
  const g = skeletonGraph(sk, crop.cw, crop.ch);
  const toSheet = (k: number) =>
    (((k / crop.cw) | 0) + crop.row0) * s.w + (k % crop.cw) + crop.col0;
  const axis = resample(
    g.path.map((k) => toLocal(s, toSheet(k))),
    L.sampleStepM,
  );
  let lengthM = 0;
  for (let k = 1; k < axis.length; k++)
    lengthM += Math.hypot(axis[k]![0] - axis[k - 1]![0], axis[k]![1] - axis[k - 1]![1]);
  const first = axis[0] ?? [0, 0];
  const last = axis[axis.length - 1] ?? [0, 0];
  const chord = Math.hypot(last[0] - first[0], last[1] - first[1]);
  const widthM = (c.cells.length * s.cell * s.cell) / Math.max(s.cell, lengthM);

  // zigzag: headings of ~5 m segments, turns between consecutive ones
  const segN = Math.max(1, Math.round(L.headingSegmentM / L.sampleStepM));
  const turns: XY[] = [];
  let prevHeading: number | null = null;
  for (let k = segN; k < axis.length; k += segN) {
    const hd = heading(axis[k - segN]!, axis[k]!);
    if (prevHeading !== null && (angleDiff(hd, prevHeading) * 180) / Math.PI > L.zigzagTurnDeg)
      turns.push(axis[k - segN]!);
    prevHeading = hd;
  }

  // major bends: smooth the axis over ~20 m (removes zigzag teeth), then 20 m segments
  const half20 = Math.max(1, Math.round(10 / L.sampleStepM));
  const smooth20 = axis.map((_, k) => {
    const a = axis.slice(Math.max(0, k - half20), k + half20 + 1);
    return [
      a.reduce((x, p) => x + p[0], 0) / a.length,
      a.reduce((x, p) => x + p[1], 0) / a.length,
    ] as XY;
  });
  const seg20 = 2 * half20;
  const majorTurns: XY[] = [];
  let prevMajor: number | null = null;
  for (let k = seg20; k < smooth20.length; k += seg20) {
    const hd = heading(smooth20[k - seg20]!, smooth20[k]!);
    if (prevMajor !== null && (angleDiff(hd, prevMajor) * 180) / Math.PI > L.zigzagTurnDeg)
      majorTurns.push(axis[k - seg20]!);
    prevMajor = hd;
  }

  // bottom elevation along the axis, smoothed over 3 m
  const z = axis.map((p) => sample(s, s.dem, p));
  const zs = z.map((_, k) => {
    const a = z.slice(Math.max(0, k - 1), k + 2);
    return a.reduce((x, y) => x + y, 0) / a.length;
  });
  let up = 0;
  let down = 0;
  for (let k = 2; k < zs.length; k += 2) {
    const d = zs[k]! - zs[k - 2]!;
    if (d > 0) up++;
    else if (d < 0) down++;
  }
  const monotonicShare = up + down ? Math.max(up, down) / (up + down) : 0;
  const gradient = lengthM ? Math.abs(zs[zs.length - 1]! - zs[0]!) / lengthM : 0;
  const win = Math.max(2, Math.round(10 / L.sampleStepM));
  let maxGradient = 0;
  for (let k = win; k < zs.length; k++)
    maxGradient = Math.max(maxGradient, Math.abs(zs[k]! - zs[k - win]!) / (win * L.sampleStepM));

  // parapet: positive LRM in strips 1–4 m beyond the edge, left vs right of travel
  const half = widthM / 2;
  let left = 0;
  let right = 0;
  const across: number[] = [];
  for (let k = 0; k < axis.length; k++) {
    const a = axis[Math.max(0, k - 2)]!;
    const b = axis[Math.min(axis.length - 1, k + 2)]!;
    const hd = heading(a, b);
    const nx = -Math.sin(hd);
    const ny = Math.cos(hd); // left normal
    const p = axis[k]!;
    for (let d = half + L.parapetStripFromM; d <= half + L.parapetStripToM; d += s.cell) {
      left += Math.max(0, sample(s, s.lrm, [p[0] + nx * d, p[1] + ny * d]));
      right += Math.max(0, sample(s, s.lrm, [p[0] - nx * d, p[1] - ny * d]));
    }
    // U profile across, every 5 m
    if (k % 5 === 2) {
      const reach = half + 2;
      const prof: number[] = [];
      for (let d = -reach; d <= reach; d += s.cell / 2)
        prof.push(-sample(s, s.lrm, [p[0] + nx * d, p[1] + ny * d]));
      const max = Math.max(...prof);
      if (max > 0) {
        const wet = prof.filter((v) => v > 0.2 * max);
        across.push(wet.filter((v) => v > 0.8 * max).length / wet.length);
      }
    }
  }
  const ratio = Math.max(left, right) / Math.max(1e-6, Math.min(left, right));
  const minMass = 0.05 * axis.length;
  const parapetSide =
    Math.max(left, right) > minMass && ratio >= L.parapetRatioMin ? (left > right ? 1 : -1) : 0;
  let parapetDir: number | null = null;
  if (parapetSide && axis.length > 2) {
    const m = Math.floor(axis.length / 2);
    const hd = heading(axis[Math.max(0, m - 2)]!, axis[Math.min(axis.length - 1, m + 2)]!);
    parapetDir = hd + (parapetSide * Math.PI) / 2;
  }

  // regional slope from cells around the line that are not part of any form
  const xs: number[] = [];
  const ys: number[] = [];
  const zz: number[] = [];
  const pad = Math.round(10 / s.cell);
  for (let row = Math.max(0, c.row0 - pad); row <= Math.min(s.h - 1, c.row1 + pad); row += 2)
    for (let col = Math.max(0, c.col0 - pad); col <= Math.min(s.w - 1, c.col1 + pad); col += 2) {
      const i = row * s.w + col;
      if (Math.abs(s.lrm[i]!) > cfg.masks.thresholdM) continue;
      xs.push(col * s.cell);
      ys.push(-row * s.cell);
      zz.push(s.dem[i]!);
    }
  const plane = fitPlane(xs, ys, zz);
  let angleToSlopeDeg = 90;
  if (plane && Math.hypot(plane.a, plane.b) > 1e-4 && chord > 0) {
    const fall = Math.atan2(plane.b, plane.a);
    const along = heading(first, last);
    const d = (angleDiff(along, fall) * 180) / Math.PI;
    angleToSlopeDeg = d > 90 ? 180 - d : d;
  }

  return {
    axis,
    lengthM,
    widthM,
    tortuosity: chord ? lengthM / chord : 1,
    zigzagPer10m: lengthM ? (turns.length / lengthM) * 10 : 0,
    turns,
    majorTurns,
    junctions: g.junctions.map((k) => toLocal(s, toSheet(k))),
    endpoints: g.endpoints.map((k) => toLocal(s, toSheet(k))),
    monotonicShare,
    gradient,
    maxGradient,
    parapetSide,
    parapetDir,
    parapetRatio: ratio,
    uShare: across.length ? across.reduce((a, b) => a + b, 0) / across.length : 0,
    angleToSlopeDeg,
  };
}
