// concrete files, not the index: the index also pulls browser-only canvas code
import { applyHomography, fitHomography } from '@/shared/lib/georef/homography';
import { sheetCorners, type SheetSeries } from '@/shared/lib/georef/sheetCorners';

export interface LatLng {
  lat: number;
  lng: number;
}
/** Image position as a fraction of width and height (0–1). */
export interface UV {
  x: number;
  y: number;
}
export interface Placement {
  method: 'arkusz' | 'nazwy';
  toLatLng: (p: UV) => LatLng;
  /** fit error in metres; null when the fit is exact (four corners) */
  rmsM: number | null;
  /** how far a placed object may be off */
  uncertaintyM: number;
}

const M_PER_DEG_LAT = 110_574;

/** Flat metric plane around a point: accurate to metres across a map sheet. */
export function localPlane(origin: LatLng) {
  const kx = 111_320 * Math.cos((origin.lat * Math.PI) / 180);
  return {
    toXY: (p: LatLng) => ({
      x: (p.lng - origin.lng) * kx,
      y: (p.lat - origin.lat) * M_PER_DEG_LAT,
    }),
    toLatLng: (x: number, y: number): LatLng => ({
      lat: origin.lat + y / M_PER_DEG_LAT,
      lng: origin.lng + x / kx,
    }),
  };
}

/** Least-squares affine map (u, v) → (x, y): x = a·u + b·v + c, y = d·u + e·v + f. */
export function fitAffine(src: readonly UV[], dst: readonly { x: number; y: number }[]) {
  // normal equations of [u v 1] for each output coordinate (3 × 3, Cramer)
  let suu = 0,
    suv = 0,
    svv = 0,
    su = 0,
    sv = 0;
  let sux = 0,
    svx = 0,
    sx = 0,
    suy = 0,
    svy = 0,
    sy = 0;
  const n = src.length;
  for (let i = 0; i < n; i++) {
    const { x: u, y: v } = src[i]!;
    const { x, y } = dst[i]!;
    suu += u * u;
    suv += u * v;
    svv += v * v;
    su += u;
    sv += v;
    sux += u * x;
    svx += v * x;
    sx += x;
    suy += u * y;
    svy += v * y;
    sy += y;
  }
  const m = [suu, suv, su, suv, svv, sv, su, sv, n];
  const det3 = (a: number[]) =>
    a[0]! * (a[4]! * a[8]! - a[5]! * a[7]!) -
    a[1]! * (a[3]! * a[8]! - a[5]! * a[6]!) +
    a[2]! * (a[3]! * a[7]! - a[4]! * a[6]!);
  const d = det3(m);
  if (Math.abs(d) < 1e-12) return null;
  const solve = (r0: number, r1: number, r2: number) => [
    det3([r0, m[1]!, m[2]!, r1, m[4]!, m[5]!, r2, m[7]!, m[8]!]) / d,
    det3([m[0]!, r0, m[2]!, m[3]!, r1, m[5]!, m[6]!, r2, m[8]!]) / d,
    det3([m[0]!, m[1]!, r0, m[3]!, m[4]!, r1, m[6]!, m[7]!, r2]) / d,
  ];
  const [a, b, c] = solve(sux, svx, sx) as [number, number, number];
  const [e2, f2, g2] = solve(suy, svy, sy) as [number, number, number];
  const apply = (p: UV) => ({ x: a * p.x + b * p.y + c, y: e2 * p.x + f2 * p.y + g2 });
  const residuals = src.map((p, i) => Math.hypot(apply(p).x - dst[i]!.x, apply(p).y - dst[i]!.y));
  const rms = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / n);
  return { apply, rms, residuals };
}

/**
 * Places the image from named places read on it and found in the gazetteer. Wrong matches
 * (another village with the same name) are dropped one by one while the fit stays poor.
 */
export function placeByNames(
  pairs: readonly { uv: UV; at: LatLng }[],
  maxRmsM = 150,
): Placement | null {
  let set = [...pairs];
  if (set.length === 2) return placeByTwoNames(set[0]!, set[1]!);
  if (set.length < 3) return null;
  const plane = localPlane({
    lat: set.reduce((s, p) => s + p.at.lat, 0) / set.length,
    lng: set.reduce((s, p) => s + p.at.lng, 0) / set.length,
  });
  for (;;) {
    const fit = fitAffine(
      set.map((p) => p.uv),
      set.map((p) => plane.toXY(p.at)),
    );
    if (!fit) return null;
    if (fit.rms <= maxRmsM) {
      return {
        method: 'nazwy',
        toLatLng: (p) => {
          const q = fit.apply(p);
          return plane.toLatLng(q.x, q.y);
        },
        rmsM: Math.round(fit.rms),
        uncertaintyM: Math.round(Math.max(40, 2 * fit.rms)),
      };
    }
    if (set.length <= 3) return null;
    const worst = fit.residuals.indexOf(Math.max(...fit.residuals));
    set = set.filter((_, i) => i !== worst);
  }
}

/** Places the image from its printed sheet number and the four frame corners seen on it. */
export function placeBySheet(
  series: SheetSeries,
  sheetNumber: string,
  frame: { nw: UV; ne: UV; se: UV; sw: UV },
): Placement | null {
  const b = sheetCorners(series, sheetNumber);
  if (!b) return null;
  const h = fitHomography(
    [frame.nw, frame.ne, frame.se, frame.sw],
    [
      { x: b.west, y: b.north },
      { x: b.east, y: b.north },
      { x: b.east, y: b.south },
      { x: b.west, y: b.south },
    ],
  );
  return {
    method: 'arkusz',
    toLatLng: (p) => {
      const q = applyHomography(h, p);
      return { lat: q.y, lng: q.x };
    },
    rmsM: null,
    // old datum (tens of metres up to 100+ m) plus reading the corners on a photo
    uncertaintyM: 150,
  };
}

/**
 * Two named places: shift, rotation and scale only (the map is not skewed), exact through both.
 * Nothing checks the fit, so the error margin is wide; anchors must be far enough apart.
 */
function placeByTwoNames(a: { uv: UV; at: LatLng }, b: { uv: UV; at: LatLng }): Placement | null {
  const plane = localPlane(a.at);
  const pa = plane.toXY(a.at);
  const pb = plane.toXY(b.at);
  const metres = Math.hypot(pb.x - pa.x, pb.y - pa.y);
  // image y grows downwards, northing upwards: flip v so the similarity has no mirror
  const du = { x: b.uv.x - a.uv.x, y: -(b.uv.y - a.uv.y) };
  const span = Math.hypot(du.x, du.y);
  // closer than 500 m, or a whole image unit (the map width) under 300 m or over 60 km: wrong match
  if (metres < 500 || span < 1e-6 || metres / span < 300 || metres / span > 60_000) return null;
  // complex ratio (pb − pa) / du = scale · e^{iθ}
  const d2 = du.x * du.x + du.y * du.y;
  const k = {
    re: ((pb.x - pa.x) * du.x + (pb.y - pa.y) * du.y) / d2,
    im: ((pb.y - pa.y) * du.x - (pb.x - pa.x) * du.y) / d2,
  };
  return {
    method: 'nazwy',
    toLatLng: (p) => {
      const u = p.x - a.uv.x;
      const v = -(p.y - a.uv.y);
      return plane.toLatLng(pa.x + k.re * u - k.im * v, pa.y + k.im * u + k.re * v);
    },
    rmsM: null,
    uncertaintyM: 300,
  };
}
