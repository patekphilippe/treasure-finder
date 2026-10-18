import { describe, expect, it } from 'vitest';
import { fieldStripWindows } from '@/shared/lib/detect/features/fieldStrips';
import {
  circularVariance,
  clusters,
  linearity,
  nearestNeighbourStats,
} from '@/shared/lib/detect/features/groups';
import { lineFeatures } from '@/shared/lib/detect/features/lines';
import { isWaterLine } from '@/shared/lib/detect/features/water';
import { buildScene } from '@/shared/lib/detect/scene';
import { probe } from '../../helpers/probe';
import { cone, mound, ridges, rng, Terrain, valley } from '../../helpers/terrain';

describe('group statistics', () => {
  const line = Array.from({ length: 6 }, (_, k) => [10 + 7 * k, 50] as [number, number]);

  it('regular line of pits: low CV, linear', () => {
    expect(nearestNeighbourStats(line)).toMatchObject({ mean: 7 });
    expect(nearestNeighbourStats(line).cv).toBeLessThan(0.05);
    expect(linearity(line).ratio).toBeLessThan(0.01);
  });

  it('random scatter: high CV, not linear', () => {
    const r = rng(3);
    const pts = Array.from({ length: 30 }, () => [r() * 150, r() * 150] as [number, number]);
    expect(nearestNeighbourStats(pts).cv).toBeGreaterThan(0.35);
    expect(linearity(pts).ratio).toBeGreaterThan(0.15);
  });

  it('circular variance and clusters', () => {
    expect(circularVariance([1, 1.05, 0.95])).toBeLessThan(0.01);
    expect(circularVariance([0, Math.PI / 2, Math.PI, -Math.PI / 2])).toBeCloseTo(1, 5);
    expect(
      clusters(
        [
          [0, 0],
          [5, 0],
          [100, 0],
        ],
        10,
      ).map((g) => g.length),
    ).toEqual([2, 1]);
  });
});

describe('field strips', () => {
  it('ridges every 8 m, 0.2 m high: windows with an ~8 m period', () => {
    const s = buildScene(new Terrain().add(ridges(20, 180, 20, 180, 8, 0.2)).grid());
    const ws = fieldStripWindows(s);
    expect(ws.length).toBeGreaterThan(0);
    for (const w of ws) expect(Math.abs(w.periodM - 8)).toBeLessThanOrEqual(1);
  });

  it('plain slope and scattered windthrows give none', () => {
    expect(fieldStripWindows(buildScene(new Terrain().grid()))).toHaveLength(0);
    const r = rng(11);
    const t = new Terrain();
    for (let k = 0; k < 40; k++) {
      const x = 25 + r() * 150;
      const y = 25 + r() * 150;
      const a = r() * 2 * Math.PI;
      t.add(cone(x, y, 4, 0.8)).add(mound(x + 3.6 * Math.cos(a), y - 3.6 * Math.sin(a), 5, 0.8));
    }
    expect(fieldStripWindows(buildScene(t.grid()))).toHaveLength(0);
  });
});

describe('water from the DEM', () => {
  it('a 15 m wide valley is a water line, a ditch is not', () => {
    const v = probe(new Terrain().add(valley(170, 15, 1.5)), 170, 100, 'concave');
    expect(isWaterLine(lineFeatures(v.s, v.c))).toBe(true);
  });
});
