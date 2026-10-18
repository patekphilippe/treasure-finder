import type { Component } from '../components';
import {
  distanceToCells,
  fitPlane,
  sectorAngle,
  sectorOf,
  windowAround,
  type Plane,
} from '../geom';
import { interpretConfig } from '../interpretConfig';
import type { Scene } from '../scene';

export interface Spoil {
  /** sectors with spoil / 8 */
  completeness: number;
  /** direction of the spoil mass (radians from east, CCW); null when there is none */
  direction: number | null;
  /** mass per sector */
  sectors: number[];
  /** largest share of the mass in two adjacent sectors */
  topPairShare: number;
  /** mean positive LRM in the strongest sector of the ring, metres */
  meanM: number;
  /** a convex area touches the pit */
  touching: boolean;
}

/** Spoil heap around a pit: positive LRM in a ring 1–4 m from the edge, in 8 sectors. */
export function spoilAround(
  s: Scene,
  c: Component,
  row: number,
  col: number,
  cfg = interpretConfig,
): Spoil {
  const sp = cfg.spoil;
  const margin = Math.ceil(sp.ringToM / s.cell) + 1;
  const win = windowAround(c, s.w, s.h, margin);
  const dist = distanceToCells(c.cells, s.w, win);
  const sectors = new Array<number>(sp.sectors).fill(0);
  const sectorCells = new Array<number>(sp.sectors).fill(0);
  let total = 0;
  let vx = 0;
  let vy = 0;
  let touching = false;
  for (let y = 0; y < win.rows; y++)
    for (let x = 0; x < win.cols; x++) {
      const dm = dist[y * win.cols + x]! * s.cell;
      if (dm <= 0) continue;
      const i = (y + win.row0) * s.w + x + win.col0;
      // edge to edge: centre distance minus one cell
      if (dm - s.cell <= sp.touchM && s.convex[i]) touching = true;
      if (dm < sp.ringFromM || dm > sp.ringToM) continue;
      const ang = Math.atan2(-(y + win.row0 - row), x + win.col0 - col);
      const k = sectorOf(ang, sp.sectors);
      sectorCells[k]!++;
      const v = Math.max(0, s.lrm[i]!);
      if (!v) continue;
      sectors[k]! += v;
      total += v;
      vx += v * Math.cos(ang);
      vy += v * Math.sin(ang);
    }
  const meanM = Math.max(...sectors.map((m, k) => (sectorCells[k] ? m / sectorCells[k]! : 0)));
  if (meanM < sp.minMeanM || total === 0) {
    return { completeness: 0, direction: null, sectors, topPairShare: 0, meanM, touching };
  }
  const max = Math.max(...sectors);
  const completeness = sectors.filter((m) => m >= sp.sectorShareMin * max).length / sp.sectors;
  let topPairShare = 0;
  for (let k = 0; k < sp.sectors; k++)
    topPairShare = Math.max(topPairShare, (sectors[k]! + sectors[(k + 1) % sp.sectors]!) / total);
  const direction =
    Math.hypot(vx, vy) > 1e-9 ? Math.atan2(vy, vx) : sectorAngle(sectors.indexOf(max), sp.sectors);
  return { completeness, direction, sectors, topPairShare, meanM, touching };
}

export interface Profile {
  /** plane fitted to the surroundings (local metres: x = col·cell, y = −row·cell) */
  plane: Plane | null;
  /** maximum depth (pit) or height (mound) against that plane, metres */
  maxM: number;
  /** share of the area deeper / higher than 80 % of the maximum */
  deepShare: number;
}

/** Depth (sign −1) or height (+1) of a form against a plane fitted to a ring around it. */
export function profileAgainstSurroundings(
  s: Scene,
  c: Component,
  sign: 1 | -1,
  cfg = interpretConfig,
): Profile {
  const pr = cfg.profile;
  const margin = Math.ceil(pr.planeRingToM / s.cell) + 1;
  const win = windowAround(c, s.w, s.h, margin);
  const dist = distanceToCells(c.cells, s.w, win);
  const xs: number[] = [];
  const ys: number[] = [];
  const zs: number[] = [];
  const t = cfg.masks.thresholdM;
  for (let y = 0; y < win.rows; y++)
    for (let x = 0; x < win.cols; x++) {
      const dm = dist[y * win.cols + x]! * s.cell;
      if (dm < pr.planeRingFromM || dm > pr.planeRingToM) continue;
      const i = (y + win.row0) * s.w + x + win.col0;
      if (Math.abs(s.lrm[i]!) > t) continue; // other forms (spoil, walls) are not the ground
      xs.push((x + win.col0) * s.cell);
      ys.push(-(y + win.row0) * s.cell);
      zs.push(s.dem[i]!);
    }
  const plane = fitPlane(xs, ys, zs);
  if (!plane) return { plane: null, maxM: 0, deepShare: 0 };
  const vals: number[] = [];
  for (const i of c.cells) {
    const row = (i / s.w) | 0;
    const col = i % s.w;
    const ground = plane.a * col * s.cell + plane.b * -row * s.cell + plane.c;
    vals.push(sign * (s.dem[i]! - ground));
  }
  const maxM = Math.max(0, ...vals);
  const deepShare =
    maxM > 0 ? vals.filter((v) => v > pr.deepShareLevel * maxM).length / vals.length : 0;
  return { plane, maxM, deepShare };
}
