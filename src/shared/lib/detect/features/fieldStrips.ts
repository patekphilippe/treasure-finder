import { interpretConfig } from '../interpretConfig';
import type { Scene } from '../scene';
import type { XY } from './lines';

export interface StripWindow {
  /** local metres of the window square: [x0, y0] top-left, size */
  x0: number;
  y0: number;
  size: number;
  periodM: number;
  peak: number;
  coherence: number;
  /** ridge direction (radians from east, CCW) */
  ridgeDir: number;
}

/**
 * Old field strips: in 50 × 50 m windows, a strongly one-directional LRM texture whose
 * profile across the ridges repeats every 5–15 m (autocorrelation peak) at a low amplitude.
 */
export function fieldStripWindows(s: Scene, cfg = interpretConfig): StripWindow[] {
  const F = cfg.fieldStrips;
  const size = Math.round(F.windowM / s.cell);
  const step = Math.round(F.stepM / s.cell);
  const out: StripWindow[] = [];
  for (let r0 = 0; r0 + size <= s.h; r0 += step)
    for (let c0 = 0; c0 + size <= s.w; c0 += step) {
      let n = 0, sum = 0, sum2 = 0, jxx = 0, jyy = 0, jxy = 0; // prettier-ignore
      let complete = true;
      for (let r = r0 + 1; r < r0 + size - 1 && complete; r++)
        for (let c = c0 + 1; c < c0 + size - 1; c++) {
          const i = r * s.w + c;
          if (!s.ok[i]) {
            complete = false;
            break;
          }
          const v = s.lrm[i]!;
          n++;
          sum += v;
          sum2 += v * v;
          const gx = (s.lrm[i + 1]! - s.lrm[i - 1]!) / 2;
          const gy = -(s.lrm[i - s.w]! - s.lrm[i + s.w]!) / 2; // north up
          jxx += gx * gx;
          jyy += gy * gy;
          jxy += gx * gy;
        }
      if (!complete || n === 0) continue;
      const mean = sum / n;
      const sd = Math.sqrt(Math.max(0, sum2 / n - mean * mean));
      if (sd < F.stdFromM || sd > F.stdToM) continue;
      const tr = jxx + jyy;
      const coherence = tr > 0 ? Math.sqrt((jxx - jyy) ** 2 + 4 * jxy * jxy) / tr : 0;
      if (coherence < F.coherenceMin) continue;
      const gradDir = 0.5 * Math.atan2(2 * jxy, jxx - jyy); // across the ridges
      const ux = Math.cos(gradDir);
      const uy = Math.sin(gradDir);
      // profile across the ridges: mean LRM per 1 m bin of the projection
      const bins = new Map<number, [number, number]>();
      for (let r = r0; r < r0 + size; r++)
        for (let c = c0; c < c0 + size; c++) {
          const t = Math.round((c * ux - r * uy) * s.cell);
          const b = bins.get(t) ?? [0, 0];
          b[0] += s.lrm[r * s.w + c]! - mean;
          b[1]++;
          bins.set(t, b);
        }
      const keys = [...bins.keys()].sort((a, b) => a - b);
      const prof = keys.map((k) => bins.get(k)![0] / bins.get(k)![1]);
      const ac = (lag: number) => {
        let num = 0, den = 0; // prettier-ignore
        for (let k = 0; k < prof.length; k++) {
          den += prof[k]! ** 2;
          if (k + lag < prof.length) num += prof[k]! * prof[k + lag]!;
        }
        return den ? num / den : 0;
      };
      let best = { lag: 0, v: -1 };
      for (let lag = F.periodFromM; lag <= F.periodToM; lag++) {
        const v = ac(lag);
        if (v > best.v && v >= ac(lag - 1) && v >= ac(lag + 1)) best = { lag, v };
      }
      if (best.v < F.peakMin) continue;
      out.push({
        x0: c0 * s.cell,
        y0: -r0 * s.cell,
        size: size * s.cell,
        periodM: best.lag,
        peak: best.v,
        coherence,
        ridgeDir: gradDir + Math.PI / 2,
      });
    }
  return out;
}

/** Groups of overlapping / touching windows. */
export function groupWindows(ws: readonly StripWindow[]): StripWindow[][] {
  const touch = (a: StripWindow, b: StripWindow) =>
    a.x0 <= b.x0 + b.size &&
    b.x0 <= a.x0 + a.size &&
    a.y0 >= b.y0 - b.size &&
    b.y0 >= a.y0 - a.size;
  const seen = new Array<boolean>(ws.length).fill(false);
  const out: StripWindow[][] = [];
  ws.forEach((_, s) => {
    if (seen[s]) return;
    seen[s] = true;
    const g = [ws[s]!];
    for (let k = 0; k < g.length; k++)
      ws.forEach((w, j) => {
        if (!seen[j] && touch(g[k]!, w)) {
          seen[j] = true;
          g.push(w);
        }
      });
    out.push(g);
  });
  return out;
}

export const windowCentre = (w: StripWindow): XY => [w.x0 + w.size / 2, w.y0 - w.size / 2];
