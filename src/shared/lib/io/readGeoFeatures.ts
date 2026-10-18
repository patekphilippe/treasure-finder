import type { Geometry } from 'geojson';
import { isLatLng, isRecord, str, type Raw } from './guards';
import { CRS_HINT } from './importGeoJSON';
import { ImportError } from './parseBackup';

const TYPES = ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon'];

/** Every [lng, lat] pair of nested coordinates is in degrees. */
function inDegrees(c: unknown): boolean {
  if (!Array.isArray(c) || c.length === 0) return false;
  if (typeof c[0] === 'number') return isLatLng(c[1] ?? null, c[0]);
  return c.every(inDegrees);
}

export interface GeoFeature {
  geometry: Geometry;
  properties: Raw;
}

/**
 * Features of a GeoJSON from QGIS with a usable geometry in WGS84. `metric` counts the ones
 * with coordinates out of the degree range; a declared metric CRS is an error.
 */
export function readGeoFeatures(json: unknown): {
  features: GeoFeature[];
  metric: number;
  all: number;
} {
  if (!isRecord(json) || (json.type !== 'FeatureCollection' && json.type !== 'Feature'))
    throw new ImportError('To nie jest plik GeoJSON');
  const crs =
    isRecord(json.crs) && isRecord(json.crs.properties) ? str(json.crs.properties.name) : '';
  if (crs && !/CRS84|4326/i.test(crs)) throw new ImportError(CRS_HINT);
  const raw: unknown[] =
    json.type === 'Feature' ? [json] : Array.isArray(json.features) ? json.features : [];
  const features: GeoFeature[] = [];
  let metric = 0;
  for (const f of raw) {
    const g = isRecord(f) && isRecord(f.geometry) ? f.geometry : null;
    if (!g || !TYPES.includes(str(g.type))) continue;
    if (!inDegrees(g.coordinates)) {
      metric++;
      continue;
    }
    features.push({
      geometry: g as unknown as Geometry,
      properties: isRecord(f) && isRecord(f.properties) ? f.properties : {},
    });
  }
  return { features, metric, all: raw.length };
}
