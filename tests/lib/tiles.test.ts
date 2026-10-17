import { describe, expect, it } from 'vitest';
import { NMT_WMTS_2180 } from '@/shared/config/geoportalWmts2180';
import { applyAffine, chooseLevel, metresToTilePixels, sourceTileRange } from '@/shared/lib/tiles';

describe('metresToTilePixels', () => {
  it('inverts a rotated, scaled grid exactly at the three anchors', () => {
    const angle = (2.5 * Math.PI) / 180; // meridian convergence at the edge of Poland
    const s = 0.6; // metres per pixel
    const p = (u: number, v: number) => ({
      x: 317_000 + s * (u * Math.cos(angle) + v * Math.sin(angle)),
      y: 373_000 + s * (u * Math.sin(angle) - v * Math.cos(angle)),
    });
    const m = metresToTilePixels(p(0, 0), p(256, 0), p(0, 256), 256);
    for (const [u, v] of [
      [0, 0],
      [256, 0],
      [0, 256],
      [256, 256],
      [128, 40],
    ] as const) {
      const r = applyAffine(m, p(u, v));
      expect(r.x).toBeCloseTo(u, 6);
      expect(r.y).toBeCloseTo(v, 6);
    }
  });
});

describe('chooseLevel', () => {
  const res = NMT_WMTS_2180.resolutions;
  it('picks the coarsest level sharp enough for the screen', () => {
    expect(res[chooseLevel(1.2, res)]).toBeCloseTo(1.3229, 3);
    expect(res[chooseLevel(0.9, res)]).toBeCloseTo(0.5292, 3);
    expect(res[chooseLevel(3000, res)]).toBeCloseTo(2116.67, 1);
  });
  it('falls back to the finest level when zoomed in further', () => {
    expect(chooseLevel(0.05, res)).toBe(12);
  });
});

describe('sourceTileRange', () => {
  it('finds the tile of a known point and clamps to the matrix', () => {
    const span = 512 * NMT_WMTS_2180.resolutions[10]!;
    const r = sourceTileRange(
      { minE: 317_700, maxE: 317_800, minN: 373_300, maxN: 373_400 },
      100_000,
      850_000,
      span,
      [1137, 1071],
    );
    expect(r).toEqual({ col0: 321, col1: 321, row0: 703, row1: 703 });
    expect(
      sourceTileRange(
        { minE: 0, maxE: 50, minN: 0, maxN: 50 },
        100_000,
        850_000,
        span,
        [1137, 1071],
      ),
    ).toBeNull();
  });
});
