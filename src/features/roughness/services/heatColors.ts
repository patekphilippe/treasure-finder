import { HEAT } from '../config/roughness';

/** Score 0–1 per pixel → RGBA heat overlay (transparent where the ground is smooth). */
export function heatColors(score: Float32Array): Uint8ClampedArray<ArrayBuffer> {
  const out = new Uint8ClampedArray(score.length * 4);
  const stops = HEAT.stops;
  for (let i = 0; i < score.length; i++) {
    const s = score[i]!;
    if (s < HEAT.from) continue;
    let k = 0;
    while (k < stops.length - 2 && s > stops[k + 1]!.at) k++;
    const lo = stops[k]!;
    const hi = stops[k + 1]!;
    const t = Math.min(1, Math.max(0, (s - lo.at) / (hi.at - lo.at)));
    for (let c = 0; c < 4; c++) out[i * 4 + c] = lo.rgba[c]! + (hi.rgba[c]! - lo.rgba[c]!) * t;
  }
  return out;
}
