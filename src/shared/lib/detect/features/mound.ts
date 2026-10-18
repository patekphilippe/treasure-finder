import type { Component } from '../components';
import { angleDiff, distanceToCells, fitPlane, windowAround, type Plane } from '../geom';
import { interpretConfig } from '../interpretConfig';
import type { Scene } from '../scene';

/**
 * Top of a mound: RMS of a plane fitted to its upper half, relative to its height.
 * A flat platform is planar (≈ 0); a dome is curved.
 */
export function topRoughness(s: Scene, c: Component, ground: Plane, heightM: number): number {
  if (heightM <= 0) return 1;
  const xs: number[] = [];
  const ys: number[] = [];
  const zs: number[] = [];
  for (const i of c.cells) {
    const row = (i / s.w) | 0;
    const col = i % s.w;
    const x = col * s.cell;
    const y = -row * s.cell;
    const h = s.dem[i]! - (ground.a * x + ground.b * y + ground.c);
    if (h < 0.5 * heightM) continue;
    xs.push(x);
    ys.push(y);
    zs.push(s.dem[i]!);
  }
  const top = fitPlane(xs, ys, zs);
  if (!top) return 1;
  let ss = 0;
  for (let k = 0; k < zs.length; k++)
    ss += (zs[k]! - (top.a * xs[k]! + top.b * ys[k]! + top.c)) ** 2;
  return Math.sqrt(ss / zs.length) / heightM;
}

/** Uphill direction of the ground plane (radians from east, CCW); null on flat ground. */
export function uphill(ground: Plane): number | null {
  return Math.hypot(ground.a, ground.b) < 1e-4 ? null : Math.atan2(ground.b, ground.a);
}

/** A cut into the slope: concave area within 4 m of the form, on its uphill side. */
export function uphillCutM2(
  s: Scene,
  c: Component,
  row: number,
  col: number,
  up: number | null,
  cfg = interpretConfig,
): number {
  if (up === null) return 0;
  const margin = Math.ceil(cfg.spoil.adjacencyM / s.cell) + 1;
  const win = windowAround(c, s.w, s.h, margin);
  const dist = distanceToCells(c.cells, s.w, win);
  let cells = 0;
  for (let y = 0; y < win.rows; y++)
    for (let x = 0; x < win.cols; x++) {
      const dm = dist[y * win.cols + x]! * s.cell;
      if (dm <= 0 || dm > cfg.spoil.adjacencyM) continue;
      const i = (y + win.row0) * s.w + x + win.col0;
      if (!s.concave[i]) continue;
      const ang = Math.atan2(-(y + win.row0 - row), x + win.col0 - col);
      if (angleDiff(ang, up) <= Math.PI / 3) cells++;
    }
  return cells * s.cell * s.cell;
}

/**
 * How much the ground just outside a mound (2–6 m from its edge) still stands above the far
 * surroundings (10–15 m), as a share of the mound's height there. A barrow ends at its edge
 * (≈ 0); a broad natural swell keeps going past the mask (high).
 */
export function flankShare(s: Scene, c: Component, cfg = interpretConfig): number {
  const margin = Math.ceil(15 / s.cell) + 1;
  const win = windowAround(c, s.w, s.h, margin);
  const dist = distanceToCells(c.cells, s.w, win);
  const far = { xs: [] as number[], ys: [] as number[], zs: [] as number[] };
  const near: [number, number, number][] = [];
  for (let y = 0; y < win.rows; y++)
    for (let x = 0; x < win.cols; x++) {
      const dm = dist[y * win.cols + x]! * s.cell;
      const i = (y + win.row0) * s.w + x + win.col0;
      const px = (x + win.col0) * s.cell;
      const py = -(y + win.row0) * s.cell;
      if (dm >= 10 && dm <= 15) {
        far.xs.push(px);
        far.ys.push(py);
        far.zs.push(s.dem[i]!);
      } else if (dm >= cfg.profile.planeRingFromM && dm <= cfg.profile.planeRingToM)
        near.push([px, py, s.dem[i]!]);
    }
  const plane = fitPlane(far.xs, far.ys, far.zs);
  if (!plane || near.length === 0) return 0;
  let top = 0;
  for (const i of c.cells) {
    const h =
      s.dem[i]! - (plane.a * (i % s.w) * s.cell + plane.b * -((i / s.w) | 0) * s.cell + plane.c);
    if (h > top) top = h;
  }
  if (top <= 0) return 0;
  const nearMean =
    near.reduce((a, [x, y, z]) => a + (z - (plane.a * x + plane.b * y + plane.c)), 0) / near.length;
  return Math.max(0, nearMean / top);
}
