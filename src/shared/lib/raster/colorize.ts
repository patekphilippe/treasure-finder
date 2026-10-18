export interface Rgba {
  rgba: Uint8ClampedArray<ArrayBuffer>;
  w: number;
  h: number;
}

/**
 * Colours a grid into RGBA, sampling every `step`-th cell so big sheets stay within the
 * canvas limits of phones. `color` returns null for transparent cells.
 */
export function colorize(
  values: Float32Array,
  w: number,
  h: number,
  step: number,
  color: (v: number, i: number) => readonly [number, number, number] | null,
): Rgba {
  const w2 = Math.ceil(w / step);
  const h2 = Math.ceil(h / step);
  const rgba = new Uint8ClampedArray(w2 * h2 * 4);
  for (let y = 0; y < h2; y++)
    for (let x = 0; x < w2; x++) {
      const i = y * step * w + x * step;
      const c = color(values[i]!, i);
      if (!c) continue;
      const o = (y * w2 + x) * 4;
      rgba[o] = c[0];
      rgba[o + 1] = c[1];
      rgba[o + 2] = c[2];
      rgba[o + 3] = 255;
    }
  return { rgba, w: w2, h: h2 };
}
