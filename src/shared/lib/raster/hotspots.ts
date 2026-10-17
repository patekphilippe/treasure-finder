export interface Hotspot {
  /** centroid in pixels */
  row: number;
  col: number;
  areaPx: number;
  meanScore: number;
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
    let count = 0, sumR = 0, sumC = 0, sumS = 0; // prettier-ignore
    while (top > 0) {
      const i = stack[--top]!;
      const y = Math.floor(i / w);
      const x = i - y * w;
      count++;
      sumR += y;
      sumC += x;
      sumS += score[i]!;
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
    out.push({
      row: sumR / count,
      col: sumC / count,
      areaPx: count,
      meanScore,
      strength: meanScore * Math.sqrt(count),
    });
  }
  return out.sort((a, b) => b.strength - a.strength);
}
