import type { XY } from '../tiles';

/** 3×3 projective map, row-major: x' = (h0·x + h1·y + h2) / (h6·x + h7·y + h8), y' likewise. */
export type Homography = readonly number[];

export function applyHomography(h: Homography, p: XY): XY {
  const w = h[6]! * p.x + h[7]! * p.y + h[8]!;
  return {
    x: (h[0]! * p.x + h[1]! * p.y + h[2]!) / w,
    y: (h[3]! * p.x + h[4]! * p.y + h[5]!) / w,
  };
}

/** An affine map (canvas order a, b, c, d, e, f) as a homography. */
export function affineHomography(
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
): Homography {
  return [a, c, e, b, d, f, 0, 0, 1];
}

/** Solves A·x = b in place by Gaussian elimination with partial pivoting. */
function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(A[r]![col]!) > Math.abs(A[piv]![col]!)) piv = r;
    if (Math.abs(A[piv]![col]!) < 1e-12) throw new Error('Punkty dopasowania leżą na jednej linii');
    [A[col], A[piv]] = [A[piv]!, A[col]!];
    [b[col], b[piv]] = [b[piv]!, b[col]!];
    for (let r = col + 1; r < n; r++) {
      const f = A[r]![col]! / A[col]![col]!;
      for (let k = col; k < n; k++) A[r]![k]! -= f * A[col]![k]!;
      b[r]! -= f * b[col]!;
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = b[r]!;
    for (let k = r + 1; k < n; k++) s -= A[r]![k]! * x[k]!;
    x[r] = s / A[r]![r]!;
  }
  return x;
}

/**
 * The homography taking four points to four others (e.g. the corners of a scan to where they
 * belong on the map). Points are normalised first so metre-sized coordinates stay well conditioned.
 */
export function fitHomography(src: readonly XY[], dst: readonly XY[]): Homography {
  if (src.length !== 4 || dst.length !== 4) throw new Error('Potrzebne są 4 punkty');
  const norm = (pts: readonly XY[]) => {
    const cx = pts.reduce((s, p) => s + p.x, 0) / 4;
    const cy = pts.reduce((s, p) => s + p.y, 0) / 4;
    const sc = Math.max(...pts.map((p) => Math.hypot(p.x - cx, p.y - cy))) || 1;
    return { cx, cy, sc, pts: pts.map((p) => ({ x: (p.x - cx) / sc, y: (p.y - cy) / sc })) };
  };
  const S = norm(src);
  const D = norm(dst);
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = S.pts[i]!;
    const { x: u, y: v } = D.pts[i]!;
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }
  const [h0, h1, h2, h3, h4, h5, h6, h7] = solve(A, b) as [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  // undo the normalisation: H = Td⁻¹ · Hn · Ts
  const Hn = [h0, h1, h2, h3, h4, h5, h6, h7, 1];
  const Ts = [1 / S.sc, 0, -S.cx / S.sc, 0, 1 / S.sc, -S.cy / S.sc, 0, 0, 1];
  const TdInv = [D.sc, 0, D.cx, 0, D.sc, D.cy, 0, 0, 1];
  return mul(TdInv, mul(Hn, Ts));
}

function mul(a: readonly number[], b: readonly number[]): number[] {
  const out = new Array<number>(9).fill(0);
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      for (let k = 0; k < 3; k++) out[r * 3 + c]! += a[r * 3 + k]! * b[k * 3 + c]!;
  return out;
}

export function invertHomography(h: Homography): Homography {
  const [a, b, c, d, e, f, g, k, l] = h as [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  const A = e * l - f * k;
  const B = -(d * l - f * g);
  const C = d * k - e * g;
  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-18) throw new Error('Dopasowanie nie daje się odwrócić');
  return [
    A / det,
    -(b * l - c * k) / det,
    (b * f - c * e) / det,
    B / det,
    (a * l - c * g) / det,
    -(a * f - c * d) / det,
    C / det,
    -(a * k - b * g) / det,
    (a * e - b * d) / det,
  ];
}
