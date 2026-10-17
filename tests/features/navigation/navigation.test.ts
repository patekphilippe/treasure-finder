import { describe, expect, it } from 'vitest';
import { isArrived } from '@/features/navigation/utils/isArrived';
import { relativeBearing } from '@/features/navigation/utils/relativeBearing';

describe('relativeBearing', () => {
  it.each([
    [90, 0, 90],
    [0, 90, -90],
    [10, 350, 20],
    [350, 10, -20],
    [180, 0, 180],
    [0, 0, 0],
  ])('bearing %d, heading %d → %d', (b, h, expected) => {
    expect(relativeBearing(b, h)).toBe(expected);
  });
});

describe('isArrived', () => {
  it('uses 5 m with a good fix', () => {
    expect(isArrived(4.9, 3)).toBe(true);
    expect(isArrived(5.1, 3)).toBe(false);
  });

  it('widens to the GPS accuracy', () => {
    expect(isArrived(9, 10)).toBe(true);
  });

  it('caps the radius at 15 m', () => {
    expect(isArrived(16, 40)).toBe(false);
    expect(isArrived(14, 40)).toBe(true);
  });

  it('handles unknown accuracy', () => {
    expect(isArrived(4, null)).toBe(true);
  });
});
