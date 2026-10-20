import { describe, expect, it } from 'vitest';
import { gridSheetAt, sheetCorners } from '@/shared/lib/georef';

describe('gridSheetAt', () => {
  it('finds the 1:100 000 sheet a town lies on: the same grid as WIG Pas/Słup', () => {
    // Poznań: KdDR 301 "Posen", WIG P39 S24
    expect(gridSheetAt(52.4083, 16.9335)).toEqual(sheetCorners('wig100', 'P39 S24'));
    // Wrocław, Kraków: any place gives the 30′ × 15′ cell around it
    for (const [lat, lng] of [
      [51.11, 17.03],
      [50.06, 19.94],
    ] as const) {
      const b = gridSheetAt(lat, lng);
      expect(b.north - b.south).toBeCloseTo(0.25, 9);
      expect(b.east - b.west).toBeCloseTo(0.5, 9);
      expect(lat).toBeGreaterThan(b.south);
      expect(lat).toBeLessThanOrEqual(b.north);
      expect(lng).toBeGreaterThanOrEqual(b.west);
      expect(lng).toBeLessThan(b.east);
      // edges at …°20′ and …°50′ east of Greenwich (Karte des Deutschen Reiches, east of Ferro)
      expect(Math.round(((b.west % 1) * 60) % 30)).toBe(20);
    }
  });
});
