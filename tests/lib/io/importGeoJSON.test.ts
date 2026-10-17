import { describe, expect, it } from 'vitest';
import { CRS_HINT, importGeoJSON } from '@/shared/lib/io';

let n = 0;
const newId = () => `id${++n}`;
const fc = (features: unknown[], extra = {}) => ({ type: 'FeatureCollection', features, ...extra });
const pt = (lng: number, lat: number, properties: Record<string, unknown> = {}) => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [lng, lat] },
  properties,
});

describe('importGeoJSON', () => {
  it('imports WGS84 points with QGIS attributes', () => {
    const r = importGeoJSON(
      fc([pt(21.01, 52.23, { nazwa: 'Lej', opis: 'duży', rodzaj: 'anomalia', glebokosc: 30 })]),
      100,
      newId,
    );
    expect(r.points[0]).toMatchObject({
      name: 'Lej',
      desc: 'duży',
      type: 'anomalia',
      depthCm: 30,
      lat: 52.23,
      lng: 21.01,
      src: 'import',
      status: 'do_sprawdzenia',
      created: 100,
    });
  });

  it('defaults to "sprawdzic" and generated names', () => {
    const r = importGeoJSON(fc([pt(19, 52)]), 0, newId);
    expect(r.points[0]).toMatchObject({ type: 'sprawdzic', name: 'Import 1' });
  });

  it('rejects metric coordinates with the EPSG:4326 hint', () => {
    expect(() => importGeoJSON(fc([pt(637000, 486000)]), 0, newId)).toThrow(CRS_HINT);
  });

  it('rejects a layer that declares EPSG:2180', () => {
    const json = fc([pt(21, 52)], {
      crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:EPSG::2180' } },
    });
    expect(() => importGeoJSON(json, 0, newId)).toThrow(/EPSG:4326/);
  });

  it('counts out-of-range points and non-point features separately', () => {
    const line = {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [] },
      properties: {},
    };
    const r = importGeoJSON(fc([pt(21, 52), pt(500000, 52), line]), 0, newId);
    expect(r).toMatchObject({ rejected: 1, skipped: 1 });
    expect(r.points).toHaveLength(1);
  });

  it('keeps ids from our own punkty.geojson so re-import merges', () => {
    const r = importGeoJSON(fc([pt(21, 52, { id: 'own-1', name: 'X' })]), 0, newId);
    expect(r.points[0]?.id).toBe('own-1');
  });

  it('rejects non-GeoJSON', () => {
    expect(() => importGeoJSON({ points: [] }, 0, newId)).toThrow(/GeoJSON/);
  });
});
