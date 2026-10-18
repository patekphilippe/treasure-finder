import { EXCLUSION_ALPHA, EXCLUSION_COLORS } from '../config/exclusionStyle';

/** Bit mask (one bit per BDOT10k group) → canvas, coloured by the lowest set bit. */
export function exclusionCanvas(mask: Uint8Array, w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const m = mask[i]!;
    if (!m) continue;
    const k = 31 - Math.clz32(m & -m);
    const [r, g, b] = EXCLUSION_COLORS[k] ?? [100, 100, 100];
    img.data[i * 4] = r;
    img.data[i * 4 + 1] = g;
    img.data[i * 4 + 2] = b;
    img.data[i * 4 + 3] = EXCLUSION_ALPHA;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}
