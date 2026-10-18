import type { Geometry } from 'geojson';
import type { Interpretation, Priority } from '@/shared/types/domain';
import type { XY } from './features/lines';
import { interpretConfig } from './interpretConfig';
import { bumpPriority } from './vocabulary';

/** Distance in metres from a point to a geometry already in local metres (0 inside polygons). */
export function distanceToGeometry(p: XY, g: Geometry): number {
  const seg = (a: number[], b: number[]) => {
    const dx = b[0]! - a[0]!;
    const dy = b[1]! - a[1]!;
    const len2 = dx * dx + dy * dy;
    const t = len2
      ? Math.max(0, Math.min(1, ((p[0] - a[0]!) * dx + (p[1] - a[1]!) * dy) / len2))
      : 0;
    return Math.hypot(p[0] - (a[0]! + t * dx), p[1] - (a[1]! + t * dy));
  };
  const line = (pts: number[][]) =>
    pts.length === 1
      ? Math.hypot(p[0] - pts[0]![0]!, p[1] - pts[0]![1]!)
      : Math.min(...pts.slice(1).map((q, i) => seg(pts[i]!, q)));
  const inside = (ring: number[][]) => {
    let c = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i] as [number, number];
      const [xj, yj] = ring[j] as [number, number];
      if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const poly = (rings: number[][][]) =>
    rings[0] && inside(rings[0]) ? 0 : Math.min(...rings.map(line));
  switch (g.type) {
    case 'Point':
      return line([g.coordinates]);
    case 'MultiPoint':
    case 'LineString':
      return line(g.coordinates);
    case 'MultiLineString':
      return Math.min(...g.coordinates.map(line));
    case 'Polygon':
      return poly(g.coordinates);
    case 'MultiPolygon':
      return Math.min(...g.coordinates.map(poly));
    case 'GeometryCollection':
      return Math.min(...g.geometries.map((x) => distanceToGeometry(p, x)));
  }
}

export interface ContextInput {
  /** distance to the nearest archival feature (settlement, road, mill, inn, ford), metres */
  archivalM: number;
  /** distance to an old road or ford detected in the NMT (not the form itself), metres */
  roadM: number;
  /** distance to water, metres */
  waterM: number;
}

/** Context 0–1: archival features (1 at 0 m → 0 at 300 m) plus bonuses, at most 1. */
export function contextScore(
  interp: Interpretation,
  c: ContextInput,
  cfg = interpretConfig,
): number {
  const S = cfg.score;
  let v = Math.max(0, 1 - c.archivalM / S.contextMaxDistanceM);
  if (c.roadM <= S.roadBonusDistanceM) v += S.roadBonus;
  if ((interp === 'oboz' || interp === 'ziemianka') && c.waterM <= S.waterBonusDistanceM)
    v += S.waterBonus;
  return Math.min(1, v);
}

/** score = 40 × relief clarity + 20 × confidence + 40 × context (0–100). */
export function score(
  reliefM: number,
  confidence: number,
  context: number,
  cfg = interpretConfig,
): number {
  const W = cfg.score.weights;
  const relief = Math.min(1, Math.abs(reliefM) / cfg.score.reliefFullM);
  return Math.round(W.relief * relief + W.confidence * confidence + W.context * context);
}

/** Strong context raises the priority by one step (never for protected or natural forms). */
export function contextPriority(p: Priority, context: number, cfg = interpretConfig): Priority {
  return context >= cfg.score.priorityBumpContext ? bumpPriority(p) : p;
}
