import type { XY } from '../tiles/tileAffine';

/** A grey window of a scan (0 black – 255 white) at (x0, y0) of the whole image. */
export interface GrayWindow {
  x0: number;
  y0: number;
  width: number;
  height: number;
  data: Uint8Array | Uint8ClampedArray;
}
export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
/** Frame corners in image pixels: north-west, north-east, south-east, south-west. */
export type FrameQuad = readonly [XY, XY, XY, XY];

/** how far from the read edge its line is looked for, as a share of the image's longer side */
const OUTWARD = 0.012;
const INWARD = 0.035;
/** lines closer than this (share of the longer side) are one frame line, e.g. a double line */
const JOIN_GAP = 0.0025;
/** width of the bands either side of a line where the ink is measured (share of the longer side) */
const BAND = 0.003;
/** the scan may be turned against the read frame by up to this much (radians) */
const MAX_TURN = (0.8 * Math.PI) / 180;
/** the ends of each edge are left out: corner labels and the other edge */
const EDGE_MARGIN = 0.08;
/** a frame line inks at least this share of its edge (labels and wear break it) */
const LINE_COVER = 0.5;
/** pieces of an edge where the frame line is found on its own (its lines need not be parallel) */
const PIECES = 6;
/** map inside, margin outside: at least this much more ink inside than outside */
const MIN_CONTRAST = 0.03;

interface Line {
  point: XY;
  dir: XY;
}
type Ink = (x: number, y: number) => number;

const turned = (d: XY, a: number): XY => ({
  x: d.x * Math.cos(a) - d.y * Math.sin(a),
  y: d.x * Math.sin(a) + d.y * Math.cos(a),
});
// inward for a frame going clockwise on the image (y down): north-west, north-east, ...
const inwardOf = (d: XY): XY => ({ x: -d.y, y: d.x });

/** Otsu threshold of the window: ink below, paper above. */
function threshold(data: GrayWindow['data']): number {
  const hist = new Float64Array(256);
  for (let i = 0; i < data.length; i++) hist[data[i]!]!++;
  let sum = 0;
  for (let v = 0; v < 256; v++) sum += v * hist[v]!;
  let below = 0,
    belowSum = 0,
    best = 0,
    at = 128;
  for (let v = 0; v < 256; v++) {
    below += hist[v]!;
    if (!below) continue;
    const above = data.length - below;
    if (!above) break;
    belowSum += v * hist[v]!;
    const m0 = belowSum / below;
    const m1 = (sum - belowSum) / above;
    const between = below * above * (m0 - m1) ** 2;
    if (between > best) {
      best = between;
      at = v + 1;
    }
  }
  return at;
}

function inkOf(win: GrayWindow): Ink {
  const t = threshold(win.data);
  return (x, y) => {
    const i = Math.floor(x) - win.x0;
    const j = Math.floor(y) - win.y0;
    if (i < 0 || j < 0 || i >= win.width || j >= win.height) return 0;
    return win.data[j * win.width + i]! < t ? 1 : 0;
  };
}

/** Share of inked points along the edge at each offset from `from` to `to` (inward positive). */
function coverage(ink: Ink, mid: XY, d: XY, half: number, from: number, to: number, step: number) {
  const n = inwardOf(d);
  const out = new Float64Array(to - from + 1);
  let count = 0;
  for (let t = -half; t <= half; t += step) {
    const bx = mid.x + t * d.x;
    const by = mid.y + t * d.y;
    for (let o = from; o <= to; o++) out[o - from]! += ink(bx + o * n.x, by + o * n.y);
    count++;
  }
  for (let k = 0; k < out.length; k++) out[k]! /= count;
  return out;
}

const sharpness = (p: Float64Array) => p.reduce((s, v) => s + v * v, 0);

/** The turn of the edge that makes its lines sharpest: coarse, then to about a pixel at the ends. */
function bestTurn(ink: Ink, mid: XY, d: XY, half: number, from: number, to: number): number {
  let best = 0;
  let bestSharp = -1;
  const scan = (center: number, span: number, step: number, along: number) => {
    let found = center;
    for (let a = center - span; a <= center + span + 1e-12; a += step) {
      const s = sharpness(coverage(ink, mid, turned(d, a), half, from, to, along));
      if (s > bestSharp) {
        bestSharp = s;
        found = a;
      }
    }
    return found;
  };
  best = scan(0, MAX_TURN, 3 / half, 6);
  bestSharp = -1;
  return scan(best, 3 / half, 0.5 / half, 2);
}

/**
 * The innermost line of a frame line group (of a double line the one at the map), to a fraction
 * of a pixel: its peak of ink and the slopes down to half of it.
 */
function innermostPeak(at: (o: number) => number, lo: number, hi: number): number | null {
  let peak: number | null = null;
  for (let o = hi; o >= lo && peak === null; o--)
    if (at(o) >= LINE_COVER && at(o) >= at(o + 1) && at(o) >= at(o - 1)) peak = o;
  if (peak === null) return null;
  const top: number = peak;
  const base = at(top) / 2;
  let w = 0,
    s = 0;
  for (const step of [-1, 1])
    for (let o = top + (step > 0 ? 1 : 0); ; o += step) {
      const v = at(o);
      if (v < base || (o !== top && v > at(o - step))) break;
      w += v - base;
      s += o * (v - base);
    }
  return w > 0 ? s / w : top;
}

/** The frame line of one edge: the line with the map inside and the margin outside. */
function snapEdge(
  read: (r: PixelRect) => GrayWindow,
  a: XY,
  b: XY,
  size: { width: number; height: number },
): Line | null {
  const long = Math.max(size.width, size.height);
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  if (length < 50) return null;
  const d0 = { x: (b.x - a.x) / length, y: (b.y - a.y) / length };
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const half = length * (0.5 - EDGE_MARGIN);
  const band = Math.max(3, Math.round(BAND * long));
  const gap = Math.max(2, Math.round(JOIN_GAP * long));
  const near = Math.round(OUTWARD * long);
  const far = Math.round(INWARD * long);
  const from = -near - band - 3;
  const to = far + band + 3;

  // the window the edge may cover at any turn
  const xs: number[] = [];
  const ys: number[] = [];
  for (const turn of [-MAX_TURN, MAX_TURN])
    for (const t of [-half, half])
      for (const o of [from, to]) {
        const d = turned(d0, turn);
        const n = inwardOf(d);
        xs.push(mid.x + t * d.x + o * n.x);
        ys.push(mid.y + t * d.y + o * n.y);
      }
  const x = Math.max(0, Math.floor(Math.min(...xs)));
  const y = Math.max(0, Math.floor(Math.min(...ys)));
  const rect = {
    x,
    y,
    width: Math.min(size.width, Math.ceil(Math.max(...xs)) + 1) - x,
    height: Math.min(size.height, Math.ceil(Math.max(...ys)) + 1) - y,
  };
  if (rect.width < 2 || rect.height < 2) return null;
  const ink = inkOf(read(rect));

  const turn = bestTurn(ink, mid, d0, half, from, to);
  const d = turned(d0, turn);
  const p = coverage(ink, mid, d, half, from, to, 1);
  const at = (o: number) => p[o - from] ?? 0;
  const mean = (lo: number, hi: number) => {
    let s = 0;
    for (let o = lo; o <= hi; o++) s += at(o);
    return s / (hi - lo + 1);
  };

  // runs of inked offsets, joined across small gaps into frame lines
  const runs: { lo: number; hi: number }[] = [];
  for (let o = -near; o <= far; o++) {
    if (at(o) < LINE_COVER) continue;
    const last = runs[runs.length - 1];
    if (last && last.hi === o - 1) last.hi = o;
    else runs.push({ lo: o, hi: o });
  }
  const groups: { lo: number; hi: number }[] = [];
  for (const r of runs) {
    const g = groups[groups.length - 1];
    if (g && r.lo - g.hi - 1 <= gap) g.hi = r.hi;
    else groups.push({ ...r });
  }
  let best: { contrast: number; lo: number; hi: number } | null = null;
  for (const g of groups) {
    const contrast = mean(g.hi + 2, g.hi + 1 + band) - mean(g.lo - 1 - band, g.lo - 2);
    if (contrast >= MIN_CONTRAST && (!best || contrast > best.contrast)) best = { contrast, ...g };
  }
  if (!best) return null;

  // the innermost line found piece by piece, a straight line through the pieces
  const found: { t: number; o: number }[] = [];
  const piece = (2 * half) / PIECES;
  for (let k = 0; k < PIECES; k++) {
    const t = -half + piece * (k + 0.5);
    const centre = { x: mid.x + t * d.x, y: mid.y + t * d.y };
    const q = coverage(ink, centre, d, piece / 2, from, to, 1);
    const o = innermostPeak((v) => q[v - from] ?? 0, best.lo - 3, best.hi + 3);
    if (o !== null) found.push({ t, o });
  }
  const whole = innermostPeak(at, best.lo, best.hi);
  const line = fitLine(found) ?? (whole === null ? null : { o0: whole, slope: 0 });
  if (!line) return null;
  const n = inwardOf(d);
  const dir = { x: d.x + line.slope * n.x, y: d.y + line.slope * n.y };
  const len = Math.hypot(dir.x, dir.y);
  return {
    point: { x: mid.x + line.o0 * n.x, y: mid.y + line.o0 * n.y },
    dir: { x: dir.x / len, y: dir.y / len },
  };
}

/** Least-squares o = o0 + slope·t through the pieces, without pieces more than 1.5 px off. */
function fitLine(
  points: readonly { t: number; o: number }[],
): { o0: number; slope: number } | null {
  let pts = points;
  for (let round = 0; round < 2; round++) {
    if (pts.length < 3) return null;
    const n = pts.length;
    const mt = pts.reduce((s, p) => s + p.t, 0) / n;
    const mo = pts.reduce((s, p) => s + p.o, 0) / n;
    let stt = 0,
      sto = 0;
    for (const p of pts) {
      stt += (p.t - mt) ** 2;
      sto += (p.t - mt) * (p.o - mo);
    }
    const slope = stt ? sto / stt : 0;
    const o0 = mo - slope * mt;
    const kept = pts.filter((p) => Math.abs(o0 + slope * p.t - p.o) <= 1.5);
    if (kept.length === pts.length || round === 1) return { o0, slope };
    pts = kept;
  }
  return null;
}

function intersect(a: Line, b: Line): XY | null {
  const den = a.dir.x * b.dir.y - a.dir.y * b.dir.x;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((b.point.x - a.point.x) * b.dir.y - (b.point.y - a.point.y) * b.dir.x) / den;
  return { x: a.point.x + t * a.dir.x, y: a.point.y + t * a.dir.y };
}

/**
 * The printed map frame read by AI from a reduced image, snapped to its lines on the full scan.
 * Each edge goes to the line with the map inside and the margin outside: a reading that took the
 * outer border of the sheet, or missed by a few pixels, lands on the neatline, while grid lines in
 * the map (map on both sides) and the outer border (margin on both sides) are passed over. An edge
 * without such a line keeps its reading; null when no edge has one. `read` gives grey pixels of a
 * part of the scan, so the whole image never has to be held at once.
 */
export function snapFrame(
  read: (r: PixelRect) => GrayWindow,
  frame: FrameQuad,
  size: { width: number; height: number },
): FrameQuad | null {
  const lines = frame.map((a, k) => {
    const b = frame[(k + 1) % 4]!;
    return { snapped: snapEdge(read, a, b, size), a, b };
  });
  if (lines.every((l) => !l.snapped)) return null;
  const edges = lines.map(({ snapped, a, b }): Line => {
    if (snapped) return snapped;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    return { point: a, dir: { x: (b.x - a.x) / len, y: (b.y - a.y) / len } };
  });
  const corners = [3, 0, 1, 2].map((prev, k) => intersect(edges[prev]!, edges[k]!));
  if (corners.some((c) => !c)) return null;
  const reach = (INWARD + OUTWARD) * 1.5 * Math.max(size.width, size.height);
  if (corners.some((c, k) => Math.hypot(c!.x - frame[k]!.x, c!.y - frame[k]!.y) > reach))
    return null;
  return corners as unknown as FrameQuad;
}
