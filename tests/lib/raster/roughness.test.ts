import { describe, expect, it } from 'vitest';
import { boxMean, hotspots, roughness } from '@/shared/lib/raster';

const N = 300;

/** Hillshade-like image: grey 180 with mild noise (smooth field). */
function base(seed = 1): Float32Array {
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647 - 0.5;
  const img = new Float32Array(N * N);
  for (let i = 0; i < img.length; i++) img[i] = 180 + rnd() * 6;
  return img;
}

/** Shaded pits: dark north-west half, bright south-east half (light from the NW). */
function addPits(img: Float32Array, x0: number, y0: number, size: number, count: number) {
  for (let k = 0; k < count; k++) {
    const cx = x0 + ((k * 37) % size);
    const cy = y0 + ((k * 53) % size);
    for (let dy = -4; dy <= 4; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        if (dx * dx + dy * dy > 16) continue;
        img[(cy + dy) * N + cx + dx]! += dx + dy < 0 ? -45 : 45;
      }
  }
}

/** Ploughed furrows: parallel stripes of the same contrast. */
function addFurrows(img: Float32Array, x0: number, y0: number, size: number) {
  for (let y = y0; y < y0 + size; y++)
    for (let x = x0; x < x0 + size; x++) img[y * N + x]! += Math.sin(x * 1.2) * 45;
}

const meanIn = (s: Float32Array, x0: number, y0: number, size: number) => {
  let sum = 0;
  for (let y = y0; y < y0 + size; y++) for (let x = x0; x < x0 + size; x++) sum += s[y * N + x]!;
  return sum / (size * size);
};

describe('boxMean', () => {
  it('matches a brute-force mean, clipped at the edges', () => {
    const img = base();
    const m = boxMean(img, N, N, 2);
    let sum = 0;
    for (let y = 0; y <= 2; y++) for (let x = 0; x <= 2; x++) sum += img[y * N + x]!;
    expect(m[0]).toBeCloseTo(sum / 9, 3);
  });
});

describe('roughness', () => {
  it('keeps a smooth field near zero', () => {
    const s = roughness(base(), N, N);
    expect(meanIn(s, 50, 50, 200)).toBeLessThan(0.05);
  });

  it('lights up a field of pits', () => {
    const img = base();
    addPits(img, 40, 40, 80, 40);
    const s = roughness(img, N, N);
    expect(meanIn(s, 50, 50, 60)).toBeGreaterThan(0.5);
    expect(meanIn(s, 200, 200, 60)).toBeLessThan(0.05);
  });

  it('scores parallel furrows far lower than pits of the same contrast', () => {
    const img = base();
    addPits(img, 40, 40, 80, 40);
    addFurrows(img, 180, 180, 80);
    const s = roughness(img, N, N);
    expect(meanIn(s, 190, 190, 60)).toBeLessThan(meanIn(s, 50, 50, 60) / 3);
  });

  it('ignores pixels without data', () => {
    const img = base();
    const valid = new Uint8Array(N * N).fill(1);
    valid.fill(0, 0, N * 10);
    expect(roughness(img, N, N, valid)[0]).toBe(0);
  });
});

describe('hotspots', () => {
  it('finds the pitted area as the strongest hotspot', () => {
    const img = base();
    addPits(img, 40, 40, 80, 40);
    const spots = hotspots(roughness(img, N, N), N, N, 0.35, 100);
    expect(spots.length).toBeGreaterThan(0);
    expect(spots[0]!.col).toBeGreaterThan(40);
    expect(spots[0]!.col).toBeLessThan(130);
    expect(spots[0]!.row).toBeGreaterThan(40);
    expect(spots[0]!.row).toBeLessThan(130);
  });
});
