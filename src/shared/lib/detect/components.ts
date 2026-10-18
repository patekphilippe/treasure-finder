/** One 8-connected component of a mask. */
export interface Component {
  /** cell indices (row * w + col) */
  cells: Int32Array;
  row0: number;
  row1: number;
  col0: number;
  col1: number;
}

export function components(mask: Uint8Array, w: number, h: number, minCells = 1): Component[] {
  const seen = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  const out: Component[] = [];
  const buf: number[] = [];
  for (let s = 0; s < w * h; s++) {
    if (!mask[s] || seen[s]) continue;
    let top = 0;
    stack[top++] = s;
    seen[s] = 1;
    buf.length = 0;
    let row0 = h, row1 = 0, col0 = w, col1 = 0; // prettier-ignore
    while (top) {
      const i = stack[--top]!;
      buf.push(i);
      const y = (i / w) | 0;
      const x = i - y * w;
      if (y < row0) row0 = y;
      if (y > row1) row1 = y;
      if (x < col0) col0 = x;
      if (x > col1) col1 = x;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          const j = yy * w + xx;
          if (mask[j] && !seen[j]) {
            seen[j] = 1;
            stack[top++] = j;
          }
        }
      }
    }
    if (buf.length >= minCells) out.push({ cells: Int32Array.from(buf), row0, row1, col0, col1 });
  }
  return out;
}

/** Component as a local mask with a margin (for morphology on the crop). */
export function cropMask(c: Component, w: number, margin: number) {
  const cw = c.col1 - c.col0 + 1 + 2 * margin;
  const ch = c.row1 - c.row0 + 1 + 2 * margin;
  const mask = new Uint8Array(cw * ch);
  for (const i of c.cells) {
    const y = ((i / w) | 0) - c.row0 + margin;
    const x = (i % w) - c.col0 + margin;
    mask[y * cw + x] = 1;
  }
  return { mask, cw, ch, row0: c.row0 - margin, col0: c.col0 - margin };
}
