type Rgb = readonly [number, number, number];

const BLUE: Rgb = [33, 102, 172];
const WHITE: Rgb = [247, 247, 247];
const RED: Rgb = [178, 24, 43];
const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/** LRM on a diverging scale: −limit blue, 0 white, +limit red (docs/PLAN.md: ±0,5 m). */
export function lrmColor(v: number, limitM = 0.5): Rgb | null {
  if (Number.isNaN(v)) return null;
  const t = Math.max(-1, Math.min(1, v / limitM));
  return t < 0 ? mix(WHITE, BLUE, -t) : mix(WHITE, RED, t);
}

/** Grey scale: `lo` black … `hi` white (pass hi < lo to invert). */
export function grayColor(v: number, lo: number, hi: number): Rgb | null {
  if (Number.isNaN(v)) return null;
  const g = Math.round(255 * Math.max(0, Math.min(1, (v - lo) / (hi - lo))));
  return [g, g, g];
}
