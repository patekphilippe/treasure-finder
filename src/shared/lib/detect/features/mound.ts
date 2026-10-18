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
