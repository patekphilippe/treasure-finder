import { describe, expect, it } from 'vitest';
import { warpCells } from '@/features/map/utils/warpCells';

const apply = (
  m: { a: number; b: number; c: number; d: number; e: number; f: number },
  x: number,
  y: number,
) => ({
  x: m.a * x + m.c * y + m.e,
  y: m.b * x + m.d * y + m.f,
});

describe('warpCells', () => {
  it('one affine map for the whole tile when the warp is affine', () => {
    const cells = warpCells((x, y) => ({ x: 2 * x + 10, y: 3 * y + 5 }), 256, 1000, 1000);
    expect(cells).toHaveLength(1);
    expect(cells[0]!.size).toBe(256);
    const p = apply(cells[0]!.m, 2 * 100 + 10, 3 * 50 + 5);
    expect(p.x).toBeCloseTo(100, 9);
    expect(p.y).toBeCloseTo(50, 9);
  });

  it('nothing where the tile misses the image', () => {
    expect(warpCells((x, y) => ({ x: x + 2000, y }), 256, 1000, 1000)).toEqual([]);
  });

  it('a strongly skewed warp: smaller parts, each true to half a pixel', () => {
    // a projective map with a big perspective across the tile
    const toImage = (x: number, y: number) => {
      const w = 1 + 0.006 * y;
      return { x: (4 * x) / w, y: (4 * y) / w };
    };
    const cells = warpCells(toImage, 256, 2000, 2000);
    expect(cells.length).toBeGreaterThan(1);
    // the parts cover the tile without gaps
    expect(cells.reduce((sum, c) => sum + c.size * c.size, 0)).toBe(256 * 256);
    for (const c of cells) {
      const q = toImage(c.x + c.size / 2, c.y + c.size / 2);
      const p = apply(c.m, q.x, q.y);
      expect(Math.hypot(p.x - (c.x + c.size / 2), p.y - (c.y + c.size / 2))).toBeLessThan(1);
    }
  });

  it('leaves out what lies beyond the horizon of the georeference', () => {
    const cells = warpCells((x, y) => (y > 128 ? null : { x, y }), 256, 1000, 1000);
    expect(cells.length).toBeGreaterThan(0);
    expect(cells.every((c) => c.y + c.size <= 128)).toBe(true);
  });
});
