import { describe, expect, it } from 'vitest';
import { sortByDistance } from '@/features/points/utils/sortByDistance';
import { makePoint } from '../../helpers/fixtures';

const points = [
  makePoint({ id: 'far', lat: 52.01, lng: 19, created: 3 }),
  makePoint({ id: 'near', lat: 52.001, lng: 19, created: 1 }),
  makePoint({ id: 'mid', lat: 52.005, lng: 19, created: 2 }),
];

describe('sortByDistance', () => {
  it('sorts nearest first with distances', () => {
    const sorted = sortByDistance(points, { lat: 52, lng: 19 });
    expect(sorted.map((s) => s.point.id)).toEqual(['near', 'mid', 'far']);
    expect(sorted[0]?.distM).toBeCloseTo(111, 0);
  });

  it('falls back to newest first without a position', () => {
    const sorted = sortByDistance(points, null);
    expect(sorted.map((s) => s.point.id)).toEqual(['far', 'mid', 'near']);
    expect(sorted.every((s) => s.distM === null)).toBe(true);
  });
});
