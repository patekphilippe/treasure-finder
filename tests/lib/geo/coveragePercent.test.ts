import type { Polygon } from 'geojson';
import { describe, expect, it } from 'vitest';
import { coveragePercent } from '@/shared/lib/geo';
import type { TrackVertex } from '@/shared/types/domain';

const LAT0 = 51.2;
const MY = 1 / 110_540; // degrees per metre north
const MX = 1 / (111_320 * Math.cos((LAT0 * Math.PI) / 180)); // per metre east (at the zone centre)
const pt = (xM: number, yM: number): TrackVertex => [LAT0 + yM * MY, 16.3 + xM * MX, 0, 3];
// 100 × 100 m square, south-west corner at (16.3, 51.2)
const zone: Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [16.3, LAT0],
      [16.3 + 100 * MX, LAT0],
      [16.3 + 100 * MX, LAT0 + 100 * MY],
      [16.3, LAT0 + 100 * MY],
      [16.3, LAT0],
    ],
  ],
};

describe('coveragePercent', () => {
  it('measures the zone area', () => {
    expect(coveragePercent(zone, [], 1).zoneAreaM2).toBeCloseTo(10_000, -2);
  });

  it('a 2 m swath straight across a 100 m square covers ~2 %', () => {
    const c = coveragePercent(zone, [[pt(-10, 50), pt(110, 50)]], 2);
    expect(c.percent).toBeCloseTo(2, 0);
  });

  it('overlapping passes are counted once', () => {
    const one = coveragePercent(zone, [[pt(-10, 50), pt(110, 50)]], 2).percent;
    const twice = coveragePercent(
      zone,
      [
        [pt(-10, 50), pt(110, 50)],
        [pt(110, 50.2), pt(-10, 50.2)],
      ],
      2,
    ).percent;
    expect(twice).toBeLessThan(one * 1.2);
  });

  it('parallel passes 1 m apart with a 1 m swath cover the strip fully', () => {
    const lines = Array.from({ length: 10 }, (_, i) => [pt(0, 10 + i), pt(100, 10 + i)]);
    expect(coveragePercent(zone, lines, 1).percent).toBeCloseTo(10, 0);
  });

  it('tracks outside the zone cover nothing', () => {
    expect(coveragePercent(zone, [[pt(200, 50), pt(300, 50)]], 2).percent).toBe(0);
  });
});
