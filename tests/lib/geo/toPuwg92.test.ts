import { describe, expect, it } from 'vitest';
import { toEpsg2180 } from '@/shared/lib/geo';
import { toPuwg92 } from '@/shared/lib/geo/toPuwg92';

describe('toPuwg92 (EPSG:2180 without proj4)', () => {
  it('matches proj4 to a millimetre across Poland and a margin around it', () => {
    for (let lat = 48.5; lat <= 55.5; lat += 0.5)
      for (let lng = 13.5; lng <= 24.5; lng += 0.5) {
        const [e, n] = toPuwg92(lat, lng);
        const [pe, pn] = toEpsg2180(lat, lng);
        expect(Math.abs(e - pe)).toBeLessThan(0.001);
        expect(Math.abs(n - pn)).toBeLessThan(0.001);
      }
  });

  it('puts the Śnieżka summit where the GUGiK NMT has its 1603 m', () => {
    const [e, n] = toPuwg92(50.736, 15.7397);
    expect(e).toBeCloseTo(270_024, -1);
    expect(n).toBeCloseTo(323_849, -1);
  });
});
