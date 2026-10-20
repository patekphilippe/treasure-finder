import { describe, expect, it } from 'vitest';
import {
  contextKind,
  importContextGeoJSON,
  importWaterGeoJSON,
  isContextGeoJSON,
  isWaterGeoJSON,
} from '@/shared/lib/io';

const fc = (features: unknown[], crs?: string) => ({
  type: 'FeatureCollection',
  ...(crs ? { crs: { type: 'name', properties: { name: crs } } } : {}),
  features,
});
const feature = (properties: Record<string, unknown>, geometry: unknown) => ({
  type: 'Feature',
  properties,
  geometry,
});
const line = {
  type: 'LineString',
  coordinates: [
    [17.1, 51.2],
    [17.11, 51.21],
  ],
};
const pt = { type: 'Point', coordinates: [17.1, 51.2] };

describe('archival context GeoJSON', () => {
  it('reads kind, also with capitals and Polish letters', () => {
    expect(contextKind('Młyn')).toBe('mlyn');
    expect(contextKind('BRÓD')).toBe('brod');
    expect(contextKind('zamek')).toBeNull();
  });

  it('turns features with kind into context features; others are skipped', () => {
    const json = fc([
      feature({ kind: 'osada' }, pt),
      feature({ kind: 'droga' }, line),
      feature({ name: 'bez rodzaju' }, pt),
    ]);
    expect(isContextGeoJSON(json)).toBe(true);
    const { context, skipped } = importContextGeoJSON(json, 'mapa.geojson');
    expect(context.map((c) => c.kind)).toEqual(['osada', 'droga']);
    expect(context[0]).toMatchObject({
      source: 'mapa.geojson',
      geometry: pt,
      seen: [{ map: { kind: 'none', label: 'mapa.geojson' }, how: 'import' }],
    });
    expect(skipped).toBe(1);
  });

  it('the same feature gets the same id (importing twice adds nothing)', () => {
    const json = fc([feature({ kind: 'karczma' }, pt)]);
    expect(importContextGeoJSON(json, 'a').context[0]!.id).toBe(
      importContextGeoJSON(json, 'b').context[0]!.id,
    );
  });

  it('metric coordinates ask for EPSG:4326', () => {
    const metric = fc([
      feature({ kind: 'osada' }, { type: 'Point', coordinates: [400000, 500000] }),
    ]);
    expect(() => importContextGeoJSON(metric, 'x')).toThrow(/EPSG:4326/);
    expect(() =>
      importContextGeoJSON(fc([feature({ kind: 'osada' }, pt)], 'urn:ogc:def:crs:EPSG::2180'), 'x'),
    ).toThrow(/EPSG:4326/);
  });

  it('a points file is not context', () => {
    expect(isContextGeoJSON(fc([feature({ name: 'Sygnał', type: 'anomalia' }, pt)]))).toBe(false);
  });
});

describe('BDOT10k water GeoJSON', () => {
  it('reads rivers, canals and surface water by x_kod or layer; ditches and points are skipped', () => {
    const lake = {
      type: 'Polygon',
      coordinates: [
        [
          [17.1, 51.2],
          [17.11, 51.2],
          [17.11, 51.21],
          [17.1, 51.2],
        ],
      ],
    };
    const json = fc([
      feature({ x_kod: 'SWRS01' }, line),
      feature(
        { layer: 'OT_SWKN_L' },
        {
          ...line,
          coordinates: [
            [17.2, 51.2],
            [17.21, 51.2],
          ],
        },
      ),
      feature({ X_KOD: 'PTWP03' }, lake),
      feature(
        { x_kod: 'SWRM01' },
        {
          ...line,
          coordinates: [
            [17.3, 51.2],
            [17.31, 51.2],
          ],
        },
      ),
      feature({ x_kod: 'SWRS01' }, pt),
      feature({ x_kod: 'BUBD01' }, lake),
    ]);
    expect(isWaterGeoJSON(json)).toBe(true);
    const { water, ditches, skipped } = importWaterGeoJSON(json, 'woda.geojson');
    expect(water.map((w) => w.geometry.type)).toEqual(['LineString', 'LineString', 'Polygon']);
    expect(ditches).toBe(1);
    expect(skipped).toBe(2);
  });

  it("kind 'woda' also counts as water", () => {
    expect(isWaterGeoJSON(fc([feature({ kind: 'woda' }, line)]))).toBe(true);
    expect(isWaterGeoJSON(fc([feature({ kind: 'osada' }, line)]))).toBe(false);
  });
});
