/** Binary erosion / dilation with a 3×3 square, repeated `r` times (outside the grid = background). */
function step(mask: Uint8Array, w: number, h: number, erode: boolean): Uint8Array {
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let all = 1;
      let any = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const yy = y + dy;
          const xx = x + dx;
          const v = yy >= 0 && yy < h && xx >= 0 && xx < w ? mask[yy * w + xx]! : 0;
          all &= v;
          any |= v;
        }
      out[y * w + x] = erode ? all : any;
    }
  return out;
}

export function erode(mask: Uint8Array, w: number, h: number, r = 1): Uint8Array {
  let m = mask;
  for (let k = 0; k < r; k++) m = step(m, w, h, true);
  return m;
}

export function dilate(mask: Uint8Array, w: number, h: number, r = 1): Uint8Array {
  let m = mask;
  for (let k = 0; k < r; k++) m = step(m, w, h, false);
  return m;
}

/** Opening removes features narrower than 2r+1 cells. */
export function open(mask: Uint8Array, w: number, h: number, r: number): Uint8Array {
  return r <= 0 ? mask : dilate(erode(mask, w, h, r), w, h, r);
}

/** Closing bridges gaps narrower than 2r+1 cells (padded so edges don't erode). */
export function close(mask: Uint8Array, w: number, h: number, r: number): Uint8Array {
  if (r <= 0) return mask;
  const p = r + 1;
  const W = w + 2 * p;
  const H = h + 2 * p;
  const padded = new Uint8Array(W * H);
  for (let y = 0; y < h; y++) padded.set(mask.subarray(y * w, y * w + w), (y + p) * W + p);
  const c = erode(dilate(padded, W, H, r), W, H, r);
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) out.set(c.subarray((y + p) * W + p, (y + p) * W + p + w), y * w);
  return out;
}

/** Background areas not connected to the border (holes). */
export function holes(mask: Uint8Array, w: number, h: number): Uint8Array {
  const outside = new Uint8Array(w * h);
  const stack: number[] = [];
  const push = (i: number) => {
    if (!mask[i] && !outside[i]) {
      outside[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < w; x++) {
    push(x);
    push((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    push(y * w);
    push(y * w + w - 1);
  }
  while (stack.length) {
    const i = stack.pop()!;
    const y = (i / w) | 0;
    const x = i - y * w;
    if (x > 0) push(i - 1);
    if (x < w - 1) push(i + 1);
    if (y > 0) push(i - w);
    if (y < h - 1) push(i + w);
  }
  const out = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) out[i] = !mask[i] && !outside[i] ? 1 : 0;
  return out;
}
