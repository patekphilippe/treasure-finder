import type { MultiPolygon, Polygon } from 'geojson';
import polygonClipping, {
  type MultiPolygon as PcMulti,
  type Polygon as PcPoly,
} from 'polygon-clipping';
import { fromEpsg2180 } from '../geo';
import type { XY } from './features/lines';
import { convexHull } from './geom';
import { interpretConfig } from './interpretConfig';
import type { ExclusionSpec, ZoneSpec } from './zoneSpec';

type Ring = [number, number][];

const close = (r: Ring): Ring => [...r, r[0]!];

export function circle(
  c: XY,
  r: number,
  segs: number = interpretConfig.zones.circleSegments,
): Ring {
  return Array.from({ length: segs }, (_, k) => {
    const a = (2 * Math.PI * k) / segs;
    return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)] as [number, number];
  });
}

/** Convex hull of points grown by `buffer` (exact for convex shapes: hull of vertex circles). */
export function hullBuffer(points: readonly XY[], buffer: number): Ring {
  const hull = convexHull(points.map((p) => [p[0], p[1]] as [number, number]));
  if (buffer <= 0) return hull;
  return convexHull(hull.flatMap((v) => circle(v, buffer, 16)));
}

function quad(a: XY, b: XY, d0: number, d1: number): Ring {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = -(b[1] - a[1]) / len; // left normal
  const ny = (b[0] - a[0]) / len;
  return [
    [a[0] + nx * d0, a[1] + ny * d0],
    [b[0] + nx * d0, b[1] + ny * d0],
    [b[0] + nx * d1, b[1] + ny * d1],
    [a[0] + nx * d1, a[1] + ny * d1],
  ];
}

const snap = (r: Ring): Ring =>
  r.map(([x, y]) => [Math.round(x * 100) / 100, Math.round(y * 100) / 100]);

/**
 * Union of rings. polygon-clipping can fail on near-degenerate overlaps, so inputs are
 * snapped to 1 cm and merged one by one; a piece that still fails is skipped, not the zone.
 */
const union = (rings: Ring[]): PcMulti => {
  let acc: PcMulti = [];
  for (const r of rings) {
    const piece: PcPoly = [close(snap(r))];
    try {
      acc = acc.length ? polygonClipping.union(acc, piece) : [piece];
    } catch {
      // skip this piece
    }
  }
  return acc;
};

/** Douglas–Peucker simplification of an axis (fewer, cleaner strip pieces). */
export function simplify(pts: readonly XY[], tol = 0.5): XY[] {
  if (pts.length < 3) return [...pts];
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const [ax, ay] = pts[a]!;
    const [bx, by] = pts[b]!;
    const len = Math.hypot(bx - ax, by - ay) || 1;
    let best = -1;
    let dmax = tol;
    for (let k = a + 1; k < b; k++) {
      const d = Math.abs((bx - ax) * (ay - pts[k]![1]) - (ax - pts[k]![0]) * (by - ay)) / len;
      if (d > dmax) {
        dmax = d;
        best = k;
      }
    }
    if (best > 0) {
      keep[best] = 1;
      stack.push([a, best], [best, b]);
    }
  }
  return pts.filter((_, k) => keep[k]);
}

/** Search zone polygons in local metres (x east, y north). Empty for 'none'. */
export function buildZoneLocal(spec: ZoneSpec): PcMulti {
  switch (spec.kind) {
    case 'none':
      return [];
    case 'hull': {
      const rings = [hullBuffer(spec.points, spec.bufferM)];
      if (spec.corridorTo) {
        const [cx, cy] = spec.points
          .reduce((a, p) => [a[0] + p[0], a[1] + p[1]], [0, 0])
          .map((v) => v / spec.points.length) as XY;
        const half = (spec.corridorWidthM ?? 10) / 2;
        rings.push(quad([cx, cy], spec.corridorTo, -half, half));
      }
      return union(rings);
    }
    case 'circles':
      return union(
        spec.centres.map((c) => {
          const dx = spec.shiftDir !== undefined ? Math.cos(spec.shiftDir) * (spec.shiftM ?? 0) : 0;
          const dy = spec.shiftDir !== undefined ? Math.sin(spec.shiftDir) * (spec.shiftM ?? 0) : 0;
          return circle([c[0] + dx, c[1] + dy], spec.radiusM);
        }),
      );
    case 'oneSide': {
      const rings: Ring[] = [];
      const [d0, d1] = spec.side > 0 ? [spec.fromM, spec.toM] : [-spec.toM, -spec.fromM];
      for (let k = 1; k < spec.axis.length; k++)
        rings.push(quad(spec.axis[k - 1]!, spec.axis[k]!, d0, d1));
      for (const c of spec.circles) rings.push(circle(c, spec.circleM));
      return union(rings);
    }
    case 'bothSides': {
      const rings: Ring[] = [];
      for (let k = 1; k < spec.axis.length; k++)
        rings.push(quad(spec.axis[k - 1]!, spec.axis[k]!, -spec.bufferM, spec.bufferM));
      for (let k = 0; k < spec.axis.length; k += 3)
        rings.push(circle(spec.axis[k]!, spec.bufferM, 12));
      for (const c of spec.circles) rings.push(circle(c, spec.circleM));
      return union(rings);
    }
    case 'squares':
      return union(
        spec.squares.map((q) => [
          [q.x0, q.y0],
          [q.x0 + q.size, q.y0],
          [q.x0 + q.size, q.y0 - q.size],
          [q.x0, q.y0 - q.size],
        ]),
      );
  }
}

export function buildExclusionLocal(spec: ExclusionSpec): PcMulti {
  return spec ? union([hullBuffer(spec.points, spec.bufferM)]) : [];
}

/** Local metres of a sheet → WGS84 GeoJSON (null when empty). */
export function toWgs84(
  mp: PcMulti,
  originE: number,
  originN: number,
): Polygon | MultiPolygon | null {
  if (mp.length === 0) return null;
  const conv = (ring: [number, number][]) =>
    ring.map(([x, y]) => {
      const [lat, lng] = fromEpsg2180(originE + x, originN + y);
      return [Math.round(lng * 1e7) / 1e7, Math.round(lat * 1e7) / 1e7];
    });
  const polys = mp.map((poly) => poly.map(conv));
  return polys.length === 1
    ? { type: 'Polygon', coordinates: polys[0]! }
    : { type: 'MultiPolygon', coordinates: polys };
}

/** Area-weighted centroid and area of local polygons (outer rings minus holes). */
export function areaCentroid(mp: PcMulti): { area: number; c: XY } {
  let A = 0;
  let cx = 0;
  let cy = 0;
  for (const poly of mp)
    poly.forEach((ring) => {
      for (let i = 0; i < ring.length - 1; i++) {
        const [x0, y0] = ring[i]!;
        const [x1, y1] = ring[i + 1]!;
        const cr = x0 * y1 - x1 * y0;
        A += cr;
        cx += (x0 + x1) * cr;
        cy += (y0 + y1) * cr;
      }
    });
  return { area: Math.abs(A / 2), c: A ? [cx / (3 * A), cy / (3 * A)] : [0, 0] };
}
