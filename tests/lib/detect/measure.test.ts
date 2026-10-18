import { describe, expect, it } from 'vitest';
import { components, croftonPerimeter, measure, open } from '@/shared/lib/detect';

function grid(w: number, h: number, inside: (x: number, y: number) => boolean) {
  const m = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) m[y * w + x] = inside(x, y) ? 1 : 0;
  return m;
}
const one = (m: Uint8Array, w: number, h: number, sign = 1, cell = 1, ring = 0) =>
  measure(components(m, w, h)[0]!, new Float32Array(w * h).fill(sign), w, cell, 4, ring);

describe('measure (ported from qgis/candidates/measure.py)', () => {
  it('disk: Crofton perimeter within 3 % and circularity ~1', () => {
    const m = grid(101, 101, (x, y) => (x - 50) ** 2 + (y - 50) ** 2 <= 400);
    expect(croftonPerimeter(m, 101, 101, 1)).toBeCloseTo(2 * Math.PI * 20, -1);
    const s = one(m, 101, 101);
    expect(s.circularity).toBeGreaterThan(0.95);
    expect(s.equivalentDiameterM).toBeCloseTo(40, 0);
  });

  it('rectangle: length, width, rectangularity, elongation, concave relief', () => {
    const m = grid(80, 40, (x, y) => x >= 10 && x < 70 && y >= 10 && y < 20);
    const s = one(m, 80, 40, -1, 0.5);
    expect(s.lengthM).toBeCloseTo(30, 5);
    expect(s.widthM).toBeCloseTo(5, 5);
    expect(s.rectangularity).toBeGreaterThan(0.99);
    expect(s.elongation).toBeCloseTo(6, 5);
    expect(s.reliefM).toBeLessThan(0);
    expect(Math.abs(Math.sin(s.axis))).toBeLessThan(1e-6); // east–west
  });

  it('rotated rectangle: extents along the PCA axes, axis at 45°', () => {
    const m = grid(120, 120, (x, y) => {
      const u = (x - 60 + (y - 60)) / Math.SQRT2;
      const v = (x - 60 - (y - 60)) / Math.SQRT2;
      return Math.abs(u) <= 30 && Math.abs(v) <= 5;
    });
    const s = one(m, 120, 120);
    expect(s.lengthM).toBeCloseTo(61, -1);
    expect(s.widthM).toBeCloseTo(11, -1);
    // rows grow southwards, so x+y = const in cells is a NW–SE line: axis −45°
    expect(Math.abs(Math.abs(s.axis) - Math.PI / 4)).toBeLessThan(0.05);
  });

  it('ring has one hole, also with a small gap in the rim after closing', () => {
    const ring = (x: number, y: number) => {
      const r2 = (x - 50) ** 2 + (y - 50) ** 2;
      return r2 <= 400 && r2 > 144;
    };
    expect(one(grid(101, 101, ring), 101, 101).holes).toBe(1);
    const gapped = grid(101, 101, (x, y) => ring(x, y) && !(x > 60 && y === 50));
    expect(one(gapped, 101, 101).holes).toBe(0);
    expect(one(gapped, 101, 101, 1, 1, 2).holes).toBe(1);
  });

  it('components are 8-connected; opening removes 1-cell lines', () => {
    const diag = grid(10, 10, (x, y) => x === y);
    expect(components(diag, 10, 10)).toHaveLength(1);
    expect(components(open(diag, 10, 10, 1), 10, 10)).toHaveLength(0);
  });
});
