import { describe, expect, it } from 'vitest';
import { acceptFix } from '@/features/gps';

const fix = (lat: number, lng: number, accM = 5) => ({ lat, lng, accM, t: 0 });
// ~1 m of latitude
const M = 1 / 111_195;

describe('acceptFix', () => {
  it('accepts the first fix when accurate enough', () => {
    expect(acceptFix(null, fix(52, 19, 30))).toBe(true);
  });

  it('rejects fixes worse than 30 m', () => {
    expect(acceptFix(null, fix(52, 19, 30.1))).toBe(false);
  });

  it('rejects fixes closer than 2 m to the previous one', () => {
    expect(acceptFix(fix(52, 19), fix(52 + 1.5 * M, 19))).toBe(false);
  });

  it('accepts fixes 2 m or more away', () => {
    expect(acceptFix(fix(52, 19), fix(52 + 2.1 * M, 19))).toBe(true);
  });

  it('rejects NaN accuracy', () => {
    expect(acceptFix(null, fix(52, 19, Number.NaN))).toBe(false);
  });
});
