import { describe, expect, it } from 'vitest';
import { haversine } from '@/shared/lib/geo';

describe('haversine', () => {
  it('returns 0 for identical points', () => {
    expect(haversine(52.23, 21.01, 52.23, 21.01)).toBe(0);
  });

  it('measures one degree of latitude as ~111.2 km', () => {
    expect(haversine(52, 19, 53, 19)).toBeCloseTo(111_195, -1);
  });

  it('measures Warsaw–Kraków as ~252 km', () => {
    const d = haversine(52.2297, 21.0122, 50.0647, 19.945);
    expect(d / 1000).toBeCloseTo(252, 0);
  });
});
