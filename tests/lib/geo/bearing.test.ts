import { describe, expect, it } from 'vitest';
import { bearing } from '@/shared/lib/geo';

describe('bearing', () => {
  it.each([
    ['north', 53, 19, 0],
    ['east', 52, 20, 90],
    ['south', 51, 19, 180],
    ['west', 52, 18, 270],
  ])('points %s', (_, lat2, lng2, expected) => {
    expect(bearing(52, 19, lat2, lng2)).toBeCloseTo(expected, 0);
  });
});
