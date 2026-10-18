import { type Component, cropMask } from './components';
import { close, holes } from './morphology';

export interface Shape {
  /** centroid in cells */
  row: number;
  col: number;
  areaM2: number;
  perimeterM: number;
  lengthM: number;
  widthM: number;
  /** major axis direction in map terms: radians from east, counter-clockwise (north = π/2) */
  axis: number;
  /** signed LRM with the largest magnitude: + convex, − concave */
  reliefM: number;
  circularity: number;
  elongation: number;
  rectangularity: number;
  holes: number;
  equivalentDiameterM: number;
}

/** Crofton perimeter (4 directions): unbiased for round shapes, unlike counting pixel edges. */
export function croftonPerimeter(mask: Uint8Array, w: number, h: number, cell: number): number {
  const at = (x: number, y: number) => (x >= 0 && x < w && y >= 0 && y < h ? mask[y * w + x]! : 0);
  let n0 = 0, n90 = 0, n45 = 0, n135 = 0; // prettier-ignore
  for (let y = -1; y < h; y++)
    for (let x = -1; x <= w; x++) {
      const a = at(x, y);
      if (a !== at(x + 1, y)) n0++;
      if (a !== at(x, y + 1)) n90++;
      if (a !== at(x + 1, y + 1)) n45++;
      if (a !== at(x - 1, y + 1)) n135++;
    }
  return (Math.PI / 8) * (n0 + n90 + (n45 + n135) / Math.SQRT2) * cell;
}

export function measure(
  c: Component,
  lrm: Float32Array,
  w: number,
  cell: number,
  minHoleM2: number,
  ringClosingCells: number,
): Shape {
  const n = c.cells.length;
  let sr = 0, sc = 0; // prettier-ignore
  let relief = 0;
  for (const i of c.cells) {
    sr += (i / w) | 0;
    sc += i % w;
    const v = lrm[i]!;
    if (Math.abs(v) > Math.abs(relief)) relief = v;
  }
  const mr = sr / n;
  const mc = sc / n;
  // covariance in map axes: x = east (col), y = north (−row)
  let sxx = 0, syy = 0, sxy = 0; // prettier-ignore
  for (const i of c.cells) {
    const x = (i % w) - mc;
    const y = -(((i / w) | 0) - mr);
    sxx += x * x;
    syy += y * y;
    sxy += x * y;
  }
  sxx /= n;
  syy /= n;
  sxy /= n;
  const axis = n > 1 ? 0.5 * Math.atan2(2 * sxy, sxx - syy) : 0;
  const ux = Math.cos(axis);
  const uy = Math.sin(axis);
  let pmin = Infinity, pmax = -Infinity, qmin = Infinity, qmax = -Infinity; // prettier-ignore
  for (const i of c.cells) {
    const x = (i % w) - mc;
    const y = -(((i / w) | 0) - mr);
    const p = x * ux + y * uy;
    const q = -x * uy + y * ux;
    if (p < pmin) pmin = p;
    if (p > pmax) pmax = p;
    if (q < qmin) qmin = q;
    if (q > qmax) qmax = q;
  }
  let length = (pmax - pmin + 1) * cell;
  let width = (qmax - qmin + 1) * cell;
  if (width > length) [length, width] = [width, length];

  const crop = cropMask(c, w, ringClosingCells + 1);
  const perimeter = croftonPerimeter(crop.mask, crop.cw, crop.ch, cell);
  const closed = close(crop.mask, crop.cw, crop.ch, ringClosingCells);
  const hole = holes(closed, crop.cw, crop.ch);
  const minHoleCells = Math.max(1, Math.round(minHoleM2 / (cell * cell)));
  let holeCount = 0;
  {
    const seen = new Uint8Array(hole.length);
    for (let s = 0; s < hole.length; s++) {
      if (!hole[s] || seen[s]) continue;
      let size = 0;
      const st = [s];
      seen[s] = 1;
      while (st.length) {
        const i = st.pop()!;
        size++;
        const y = (i / crop.cw) | 0;
        const x = i - y * crop.cw;
        for (const j of [i - 1, i + 1, i - crop.cw, i + crop.cw]) {
          const yy = (j / crop.cw) | 0;
          const xx = j - yy * crop.cw;
          if (j < 0 || j >= hole.length || Math.abs(xx - x) + Math.abs(yy - y) !== 1) continue;
          if (hole[j] && !seen[j]) {
            seen[j] = 1;
            st.push(j);
          }
        }
      }
      if (size >= minHoleCells) holeCount++;
    }
  }
  const area = n * cell * cell;
  return {
    row: mr,
    col: mc,
    areaM2: area,
    perimeterM: perimeter,
    lengthM: length,
    widthM: width,
    axis,
    reliefM: relief,
    circularity: perimeter ? Math.min(1, (4 * Math.PI * area) / perimeter ** 2) : 0,
    elongation: length / width,
    rectangularity: Math.min(1, area / (length * width)),
    holes: holeCount,
    equivalentDiameterM: 2 * Math.sqrt(area / Math.PI),
  };
}
