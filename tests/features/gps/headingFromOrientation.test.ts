import { describe, expect, it } from 'vitest';
import { headingFromOrientation } from '@/features/gps/utils/headingFromOrientation';

describe('headingFromOrientation', () => {
  it('converts absolute alpha (counter-clockwise) to a clockwise heading', () => {
    expect(headingFromOrientation({ alpha: 90, absolute: true })).toBe(270);
    expect(headingFromOrientation({ alpha: 0, absolute: true })).toBe(0);
  });

  it('prefers webkitCompassHeading on iOS', () => {
    expect(headingFromOrientation({ alpha: 10, absolute: false, webkitCompassHeading: 45 })).toBe(
      45,
    );
  });

  it('returns null for relative orientation', () => {
    expect(headingFromOrientation({ alpha: 10, absolute: false })).toBeNull();
  });

  it('adds the screen rotation in landscape', () => {
    expect(headingFromOrientation({ alpha: 0, absolute: true }, 90)).toBe(90);
    expect(headingFromOrientation({ alpha: 300, absolute: true }, 270)).toBe(330);
  });
});
