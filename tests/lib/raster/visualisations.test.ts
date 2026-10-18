import { describe, expect, it } from 'vitest';
import { colorize, grayColor, hillshadeMulti, lrmColor, slopeHorn } from '@/shared/lib/raster';

const plane = (w: number, h: number, f: (x: number, y: number) => number) => {
  const a = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) a[y * w + x] = f(x, y);
  return a;
};

describe('Horn slope', () => {
  it('a 45° plane rising to the east has 45° everywhere, edges included', () => {
    const s = slopeHorn(
      plane(20, 20, (x) => x),
      20,
      20,
      1,
    );
    expect(Math.min(...s)).toBeCloseTo(45, 4);
    expect(Math.max(...s)).toBeCloseTo(45, 4);
  });

  it('flat ground has no slope; a 2° plane at 0.5 m cells reads 2°', () => {
    expect(
      Math.max(
        ...slopeHorn(
          plane(9, 9, () => 100),
          9,
          9,
          1,
        ),
      ),
    ).toBe(0);
    const k = Math.tan((2 * Math.PI) / 180);
    const s = slopeHorn(
      plane(10, 10, (_, y) => -y * 0.5 * k),
      10,
      10,
      0.5,
    );
    expect(s[55]).toBeCloseTo(2, 3);
  });
});

describe('multi-directional hillshade', () => {
  it('flat ground is lit as the sun altitude allows (sin 35°)', () => {
    const hs = hillshadeMulti(
      plane(8, 8, () => 0),
      8,
      8,
      1,
    );
    expect(hs[20]).toBeCloseTo(Math.sin((35 * Math.PI) / 180), 5);
  });

  it('slopes facing north-west are lit, facing south-east shaded, the same for all four sides', () => {
    const at = (f: (x: number, y: number) => number) =>
      hillshadeMulti(plane(10, 10, f), 10, 10, 1)[55]!;
    const flat = Math.sin((35 * Math.PI) / 180);
    // ground falling to the west / north faces the light
    expect(at((x) => x * 0.3)).toBeGreaterThan(flat);
    expect(at((_, y) => y * 0.3)).toBeGreaterThan(flat);
    expect(at((x) => -x * 0.3)).toBeLessThan(flat);
    // west- and north-facing slopes look alike: no favoured axis within the half circle
    expect(at((x) => x * 0.3)).toBeCloseTo(
      at((_, y) => y * 0.3),
      3,
    );
  });

  it('a pit stands out: its two sides differ (full-circle averaging would flatten it)', () => {
    const pit = (x: number, y: number) => -Math.max(0, 3 - Math.hypot(x - 10, y - 10));
    const hs = hillshadeMulti(plane(21, 21, pit), 21, 21, 1);
    expect(Math.abs(hs[10 * 21 + 8]! - hs[10 * 21 + 12]!)).toBeGreaterThan(0.2);
  });
});

describe('colours', () => {
  it('LRM: concave blue, convex red, zero white, NODATA transparent', () => {
    expect(lrmColor(-0.5)).toEqual([33, 102, 172]);
    expect(lrmColor(0.9)).toEqual([178, 24, 43]);
    expect(lrmColor(0)).toEqual([247, 247, 247]);
    expect(lrmColor(Number.NaN)).toBeNull();
  });

  it('grey scale clamps and can run inverted', () => {
    expect(grayColor(2, 0, 1)).toEqual([255, 255, 255]);
    expect(grayColor(0, 45, 0)).toEqual([255, 255, 255]);
  });

  it('colorize samples every step-th cell to keep the image small', () => {
    const img = colorize(
      plane(10, 7, (x) => x),
      10,
      7,
      3,
      (v) => [v, v, v],
    );
    expect([img.w, img.h]).toEqual([4, 3]);
    expect(img.rgba[4]).toBe(3);
    expect(img.rgba[7]).toBe(255);
  });
});
