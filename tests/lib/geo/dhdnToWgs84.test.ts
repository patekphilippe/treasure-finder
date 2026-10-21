import proj4 from 'proj4';
import { describe, expect, it } from 'vitest';
import { dhdnToWgs84 } from '@/shared/lib/geo/dhdnToWgs84';

proj4.defs(
  'DHDN',
  '+proj=longlat +ellps=bessel +towgs84=598.1,73.7,418.2,0.202,0.045,-2.455,6.7 +no_defs',
);
const metres = (a: { lat: number; lng: number }, b: [number, number]) =>
  Math.hypot(
    (a.lat - b[1]) * 110_574,
    (a.lng - b[0]) * 111_320 * Math.cos((a.lat * Math.PI) / 180),
  );

describe('dhdnToWgs84', () => {
  it('matches PROJ to a few centimetres across Poland and the former German east', () => {
    for (const [lat, lng] of [
      [52.5, 16.8333], // KdDR 301 Posen, north-west corner
      [51.1, 17.03], // Wrocław
      [54.35, 18.65], // Gdańsk
      [50.7, 15.7], // Karkonosze
    ] as const) {
      expect(metres(dhdnToWgs84(lat, lng), proj4('DHDN', 'EPSG:4326', [lng, lat]))).toBeLessThan(
        0.05,
      );
    }
  });

  it('around Poznań the old German frame lies ~150 m north and ~155 m east of WGS84', () => {
    const w = dhdnToWgs84(52.375, 17.0833);
    expect((w.lat - 52.375) * 110_574).toBeCloseTo(-149, -1);
    expect((w.lng - 17.0833) * 111_320 * Math.cos((52.375 * Math.PI) / 180)).toBeCloseTo(-156, -1);
  });
});
