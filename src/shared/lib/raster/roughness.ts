import { boxMean } from './boxMean';

export interface RoughnessParams {
  /** high-pass radius in pixels: keeps features smaller than ~2r (pits, mounds, trenches) */
  highpassRadius: number;
  /** window radius in pixels over which the irregularity "energy" is averaged */
  windowRadius: number;
  /**
   * 0–1: how strongly one-directional texture (furrows, plantation rows, roads) is discounted.
   * Must stay ~1: with a single sun azimuth even pits are fairly coherent (≈0.75) while
   * furrows are ≈0.997, so only the full factor (1 − coherence) separates them (~80×).
   */
  lineDiscount: number;
  /** robust z-scores mapped to 0 (at zLow) … 1 (at zHigh) */
  zLow: number;
  zHigh: number;
}

export const DEFAULT_ROUGHNESS: RoughnessParams = {
  highpassRadius: 4,
  windowRadius: 12,
  lineDiscount: 1,
  zLow: 2,
  zHigh: 6,
};

function median(values: Float32Array): number {
  const sorted = Float32Array.from(values).sort();
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

/**
 * "Uneven ground" score 0–1 from a hillshade image: local energy of small-scale relief,
 * discounted where it is one-directional (structure-tensor coherence), normalised
 * against the scene (median / MAD), so smooth fields stay 0 and pitted ground lights up.
 * `valid` marks pixels with data (outside the NMT the image is blank).
 */
export function roughness(
  gray: Float32Array,
  w: number,
  h: number,
  valid: Uint8Array | null = null,
  p: RoughnessParams = DEFAULT_ROUGHNESS,
): Float32Array {
  const n = w * h;
  const low = boxMean(gray, w, h, p.highpassRadius);
  const hp = new Float32Array(n);
  for (let i = 0; i < n; i++) hp[i] = gray[i]! - low[i]!;

  const hp2 = new Float32Array(n);
  const gxx = new Float32Array(n);
  const gyy = new Float32Array(n);
  const gxy = new Float32Array(n);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      hp2[i] = hp[i]! * hp[i]!;
      const gx = (hp[y * w + Math.min(w - 1, x + 1)]! - hp[y * w + Math.max(0, x - 1)]!) / 2;
      const gy = (hp[Math.min(h - 1, y + 1) * w + x]! - hp[Math.max(0, y - 1) * w + x]!) / 2;
      gxx[i] = gx * gx;
      gyy[i] = gy * gy;
      gxy[i] = gx * gy;
    }
  }
  const r = p.windowRadius;
  const energy = boxMean(hp2, w, h, r);
  const jxx = boxMean(gxx, w, h, r);
  const jyy = boxMean(gyy, w, h, r);
  const jxy = boxMean(gxy, w, h, r);

  const iso = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const trace = jxx[i]! + jyy[i]!;
    const coherence =
      trace > 1e-12 ? Math.sqrt((jxx[i]! - jyy[i]!) ** 2 + 4 * jxy[i]! ** 2) / trace : 0;
    iso[i] = Math.sqrt(energy[i]!) * (1 - p.lineDiscount * coherence);
  }

  // robust scene statistics from a sample of valid pixels
  const step = Math.max(1, Math.floor(n / 200_000));
  const sample: number[] = [];
  for (let i = 0; i < n; i += step) if (!valid || valid[i]) sample.push(iso[i]!);
  const s = Float32Array.from(sample);
  const med = median(s);
  const mad = median(s.map((v) => Math.abs(v - med))) * 1.4826 || 1e-6;

  const score = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    if (valid && !valid[i]) continue;
    const z = (iso[i]! - med) / mad;
    score[i] = Math.min(1, Math.max(0, (z - p.zLow) / (p.zHigh - p.zLow)));
  }
  return score;
}
