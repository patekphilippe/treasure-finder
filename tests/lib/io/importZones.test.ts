import { describe, expect, it } from 'vitest';
import { importZonesGeoJSON } from '@/shared/lib/io';
import { distanceToZoneEdge } from '@/shared/lib/geo';
import type { Polygon } from 'geojson';

let n = 0;
const id = () => `z${++n}`;
const square = (lng0: number, lat0: number, d = 0.001): Polygon => ({
  type: 'Polygon',
  coordinates: [
    [
      [lng0, lat0],
      [lng0 + d, lat0],
      [lng0 + d, lat0 + d],
      [lng0, lat0 + d],
      [lng0, lat0],
    ],
  ],
});
const fc = (features: unknown[], extra = {}) => ({ type: 'FeatureCollection', features, ...extra });

describe('importZonesGeoJSON', () => {
  it('imports permit polygons with QGIS attributes', () => {
    const json = fc([
      {
        type: 'Feature',
        geometry: square(16.3, 51.2),
        properties: {
          nazwa: 'Pole Kowalskiego',
          numer_zgloszenia: 'ZG/12/2027',
          wlasciciel: 'Jan Kowalski',
          wazna_do: '2027-03-31',
        },
      },
    ]);
    const { zones } = importZonesGeoJSON(json, 'zgoda', id);
    expect(zones[0]).toMatchObject({
      name: 'Pole Kowalskiego',
      kind: 'zgoda',
      permitNo: 'ZG/12/2027',
      owner: 'Jan Kowalski',
    });
    expect(new Date(zones[0]!.validUntil!).getDate()).toBe(31);
  });

  it('ignores permit fields for forbidden zones and names them by default', () => {
    const json = fc([
      { type: 'Feature', geometry: square(16.3, 51.2), properties: { numer: 'x' } },
    ]);
    expect(importZonesGeoJSON(json, 'zakaz', id).zones[0]).toEqual(
      expect.objectContaining({ name: 'Zakaz 1', kind: 'zakaz' }),
    );
    expect(importZonesGeoJSON(json, 'zakaz', id).zones[0]).not.toHaveProperty('permitNo');
  });

  it('rejects metric coordinates with the EPSG:4326 hint', () => {
    const json = fc([{ type: 'Feature', geometry: square(317000, 373000, 100), properties: {} }]);
    expect(() => importZonesGeoJSON(json, 'zgoda', id)).toThrow(/EPSG:4326/);
  });

  it('rejects files without polygons', () => {
    const json = fc([
      { type: 'Feature', geometry: { type: 'Point', coordinates: [16, 51] }, properties: {} },
    ]);
    expect(() => importZonesGeoJSON(json, 'zgoda', id)).toThrow(/poligonów/);
  });
});

describe('distanceToZoneEdge', () => {
  // ~70 × 111 m square
  const zone = square(16.3, 51.2);
  it('is positive inside and negative outside', () => {
    expect(distanceToZoneEdge(51.2005, 16.3005, zone)).toBeGreaterThan(30);
    expect(distanceToZoneEdge(51.2005, 16.2995, zone)).toBeLessThan(0);
  });

  it('measures metres to the nearest edge', () => {
    // 0.0001° of latitude ≈ 11 m inside the southern edge
    expect(distanceToZoneEdge(51.2001, 16.3005, zone)).toBeCloseTo(11.05, 0);
  });
});
