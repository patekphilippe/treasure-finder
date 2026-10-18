/** NODATA (NaN) → value of the nearest valid cell (multi-source BFS); for computation only. */
export function fillNodata(dem: Float32Array, w: number, h: number): Float32Array {
  const out = Float32Array.from(dem);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;
  for (let i = 0; i < w * h; i++) if (!Number.isNaN(out[i]!)) queue[tail++] = i;
  if (tail === 0 || tail === w * h) return out;
  while (head < tail) {
    const i = queue[head++]!;
    const y = (i / w) | 0;
    const x = i - y * w;
    const v = out[i]!;
    if (x > 0 && Number.isNaN(out[i - 1]!)) {
      out[i - 1] = v;
      queue[tail++] = i - 1;
    }
    if (x < w - 1 && Number.isNaN(out[i + 1]!)) {
      out[i + 1] = v;
      queue[tail++] = i + 1;
    }
    if (y > 0 && Number.isNaN(out[i - w]!)) {
      out[i - w] = v;
      queue[tail++] = i - w;
    }
    if (y < h - 1 && Number.isNaN(out[i + w]!)) {
      out[i + w] = v;
      queue[tail++] = i + w;
    }
  }
  return out;
}
