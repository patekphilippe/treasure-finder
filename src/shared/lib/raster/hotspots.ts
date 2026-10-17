export interface Hotspot {
  /** centroid in pixels */
  row: number;
  col: number;
  areaPx: number;
  meanScore: number;
  /** length / width from the area's second moments (1 = round) */
  elongation: number;
  /** ranking value: mean score × √area */
  strength: number;
}

/** 8-connected areas where score ≥ threshold, at least `minPixels` large, strongest first. */
export function hotspots(
  score: Float32Array,
  w: number,
  h: number,
  threshold: number,
  minPixels: number,
): Hotspot[] {
  const seen = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  const out: Hotspot[] = [];
  for (let start = 0; start < w * h; start++) {
    if (seen[start] || score[start]! < threshold) continue;
    let top = 0;
    stack[top++] = start;
    seen[start] = 1;
    let count = 0, sumR = 0, sumC = 0, sumS = 0, sRR = 0, sCC = 0, sRC = 0; // prettier-ignore
    while (top > 0) {
      const i = stack[--top]!;
      const y = Math.floor(i / w);
      const x = i - y * w;
      count++;
      sumR += y;
      sumC += x;
      sumS += score[i]!;
      sRR += y * y;
      sCC += x * x;
      sRC += x * y;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          const j = yy * w + xx;
          if (!seen[j] && score[j]! >= threshold) {
            seen[j] = 1;
            stack[top++] = j;
          }
        }
      }
    }
    if (count < minPixels) continue;
    const meanScore = sumS / count;
    const mr = sumR / count;
    const mc = sumC / count;
    const vrr = sRR / count - mr * mr;
    const vcc = sCC / count - mc * mc;
    const vrc = sRC / count - mr * mc;
    const half = Math.sqrt(((vrr - vcc) / 2) ** 2 + vrc * vrc);
    const l1 = (vrr + vcc) / 2 + half;
    const l2 = Math.max((vrr + vcc) / 2 - half, 1e-6);
    out.push({
      row: mr,
      col: mc,
      areaPx: count,
      meanScore,
      elongation: Math.sqrt(l1 / l2),
      strength: meanScore * Math.sqrt(count),
    });
  }
  return out.sort((a, b) => b.strength - a.strength);
}
