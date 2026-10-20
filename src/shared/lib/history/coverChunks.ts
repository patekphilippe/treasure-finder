/** A square window to read, EPSG:2180 metres. */
export interface Chunk {
  minE: number;
  maxE: number;
  minN: number;
  maxN: number;
}

const inside = (e: number, n: number, poly: readonly (readonly [number, number])[]) => {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ei, ni] = poly[i]!;
    const [ej, nj] = poly[j]!;
    if (ni > n !== nj > n && e < ((ej - ei) * (n - ni)) / (nj - ni) + ei) hit = !hit;
  }
  return hit;
};

/** samples across a window (5 × 5): a sliver of the map at its edge is still found */
const SAMPLES = [0, 0.25, 0.5, 0.75, 1];

/**
 * Square windows of side `sizeM`, overlapping by `overlapM`, that cover a map's footprint (its
 * corners in EPSG:2180, in order around it). Windows that miss the map are left out, so a
 * rotated sheet is not read with empty corners.
 */
export function coverChunks(
  footprint: readonly (readonly [number, number])[],
  sizeM: number,
  overlapM: number,
): Chunk[] {
  const es = footprint.map((p) => p[0]);
  const ns = footprint.map((p) => p[1]);
  const minE = Math.min(...es);
  const maxE = Math.max(...es);
  const minN = Math.min(...ns);
  const maxN = Math.max(...ns);
  const step = sizeM - overlapM;
  const cols = Math.max(1, Math.ceil((maxE - minE - overlapM) / step));
  const rows = Math.max(1, Math.ceil((maxN - minN - overlapM) / step));
  // centre the grid on the map so the spare margin is split on both sides
  const e0 = (minE + maxE) / 2 - (cols * step + overlapM) / 2;
  const n1 = (minN + maxN) / 2 + (rows * step + overlapM) / 2;
  const out: Chunk[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const w: Chunk = {
        minE: e0 + c * step,
        maxE: e0 + c * step + sizeM,
        maxN: n1 - r * step,
        minN: n1 - r * step - sizeM,
      };
      const hits =
        footprint.some(([e, n]) => e >= w.minE && e <= w.maxE && n >= w.minN && n <= w.maxN) ||
        SAMPLES.some((fx) =>
          SAMPLES.some((fy) => inside(w.minE + fx * sizeM, w.minN + fy * sizeM, footprint)),
        );
      if (hits) out.push(w);
    }
  return out;
}
