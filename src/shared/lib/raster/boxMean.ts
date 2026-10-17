/** Mean over a (2r+1)² window via a summed-area table, O(n); windows are clipped at the edges. */
export function boxMean(src: Float32Array, w: number, h: number, r: number): Float32Array {
  const W = w + 1;
  const sat = new Float64Array(W * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += src[y * w + x]!;
      sat[(y + 1) * W + x + 1] = sat[y * W + x + 1]! + row;
    }
  }
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - r);
    const y1 = Math.min(h, y + r + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(w, x + r + 1);
      const sum = sat[y1 * W + x1]! - sat[y0 * W + x1]! - sat[y1 * W + x0]! + sat[y0 * W + x0]!;
      out[y * w + x] = sum / ((y1 - y0) * (x1 - x0));
    }
  }
  return out;
}
