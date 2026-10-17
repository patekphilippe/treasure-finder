import type { FieldPoint, PointType } from '@/shared/types/domain';
import { isLatLng, isRecord, num, POINT_TYPE_VALUES, str } from './guards';
import { ImportError } from './parseBackup';

export interface GeoJSONImport {
  points: FieldPoint[];
  /** features outside the degree range (likely a metric CRS) */
  rejected: number;
  /** features that are not points */
  skipped: number;
}

export const CRS_HINT =
  'Współrzędne wyglądają na metryczne (np. EPSG:2180). Zapisz warstwę w QGIS w układzie EPSG:4326 (WGS 84).';

const pick = (props: Record<string, unknown>, ...keys: string[]) =>
  keys.map((k) => props[k]).find((v) => v !== undefined && v !== null && v !== '');

/** Declared CRS other than WGS 84 (QGIS writes `crs` for non-4326 layers). */
function declaredMetricCrs(json: Record<string, unknown>): boolean {
  const name =
    isRecord(json.crs) && isRecord(json.crs.properties) ? str(json.crs.properties.name) : '';
  return name !== '' && !/CRS84|4326/i.test(name);
}

/**
 * Point features from a QGIS GeoJSON export → FieldPoints (src 'import').
 * Reads name/nazwa, desc/opis, type/rodzaj and depth fields when present.
 */
export function importGeoJSON(json: unknown, now: number, newId: () => string): GeoJSONImport {
  if (!isRecord(json) || (json.type !== 'FeatureCollection' && json.type !== 'Feature')) {
    throw new ImportError('To nie jest plik GeoJSON');
  }
  if (declaredMetricCrs(json)) throw new ImportError(CRS_HINT);
  const features =
    json.type === 'Feature' ? [json] : Array.isArray(json.features) ? json.features : [];

  const points: FieldPoint[] = [];
  let rejected = 0;
  let skipped = 0;
  for (const feature of features) {
    const geometry = isRecord(feature) && isRecord(feature.geometry) ? feature.geometry : null;
    const props = isRecord(feature) && isRecord(feature.properties) ? feature.properties : {};
    const coords: unknown[] =
      geometry?.type === 'Point'
        ? [geometry.coordinates]
        : geometry?.type === 'MultiPoint' && Array.isArray(geometry.coordinates)
          ? geometry.coordinates
          : [];
    if (coords.length === 0) {
      skipped++;
      continue;
    }
    coords.forEach((c, i) => {
      const lng = Array.isArray(c) ? num(c[0]) : null;
      const lat = Array.isArray(c) ? num(c[1]) : null;
      if (!isLatLng(lat, lng)) {
        rejected++;
        return;
      }
      const rawType = str(pick(props, 'type', 'rodzaj')).toLowerCase();
      const ownId = str(props.id);
      points.push({
        id: ownId && coords.length === 1 ? ownId : newId(),
        type: POINT_TYPE_VALUES.includes(rawType as PointType)
          ? (rawType as PointType)
          : 'sprawdzic',
        status: 'do_sprawdzenia',
        name:
          str(pick(props, 'name', 'nazwa', 'Name', 'NAZWA')) || `Import ${points.length + 1 + i}`,
        desc: str(pick(props, 'desc', 'opis', 'description', 'Opis')),
        depthCm: num(pick(props, 'depthCm', 'depth', 'glebokosc')),
        lat: lat as number,
        lng: lng as number,
        accM: null,
        src: 'import',
        photoId: null,
        created: num(props.created) ?? now,
        updated: num(props.updated) ?? now,
      });
    });
  }
  if (points.length === 0 && rejected > 0) throw new ImportError(CRS_HINT);
  return { points, rejected, skipped };
}
