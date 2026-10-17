import type { MultiPolygon, Polygon } from 'geojson';
import type { Zone } from '@/shared/types/domain';
import { isLatLng, isRecord, num, str } from './guards';
import { CRS_HINT } from './importGeoJSON';
import { ImportError } from './parseBackup';

const pick = (p: Record<string, unknown>, ...keys: string[]) =>
  keys.map((k) => p[k]).find((v) => v !== undefined && v !== null && v !== '');

/** "2027-03-31", ISO date-time or epoch ms → epoch ms (end of that day for plain dates). */
function parseDate(v: unknown): number | undefined {
  const n = num(v);
  if (n !== null && n > 1e11) return n;
  const s = str(v).trim();
  if (!s) return undefined;
  const t = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T23:59:59` : s);
  return Number.isFinite(t) ? t : undefined;
}

function inDegrees(geometry: Polygon | MultiPolygon): boolean {
  const rings = geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat();
  return rings.every((ring) => ring.every(([lng, lat]) => isLatLng(lat ?? null, lng ?? null)));
}

/**
 * Polygons from QGIS (EPSG:4326) → zones of the chosen kind. Reads name/nazwa,
 * permitNo/numer_zgloszenia, owner/wlasciciel and validUntil/wazna_do when present.
 */
export function importZonesGeoJSON(
  json: unknown,
  kind: Zone['kind'],
  newId: () => string,
): { zones: Zone[]; skipped: number } {
  if (!isRecord(json) || (json.type !== 'FeatureCollection' && json.type !== 'Feature')) {
    throw new ImportError('To nie jest plik GeoJSON');
  }
  const crs =
    isRecord(json.crs) && isRecord(json.crs.properties) ? str(json.crs.properties.name) : '';
  if (crs && !/CRS84|4326/i.test(crs)) throw new ImportError(CRS_HINT);
  const features =
    json.type === 'Feature' ? [json] : Array.isArray(json.features) ? json.features : [];

  const zones: Zone[] = [];
  let metric = 0;
  for (const f of features) {
    const g = isRecord(f) && isRecord(f.geometry) ? f.geometry : null;
    if (!g || (g.type !== 'Polygon' && g.type !== 'MultiPolygon') || !Array.isArray(g.coordinates))
      continue;
    const geometry = g as unknown as Polygon | MultiPolygon;
    if (!inDegrees(geometry)) {
      metric++;
      continue;
    }
    const p = isRecord(f) && isRecord(f.properties) ? f.properties : {};
    const zone: Zone = {
      id: newId(),
      name:
        str(pick(p, 'name', 'nazwa', 'Name', 'NAZWA')) ||
        `${kind === 'zgoda' ? 'Zgoda' : 'Zakaz'} ${zones.length + 1}`,
      kind,
      geometry,
    };
    if (kind === 'zgoda') {
      const permitNo = str(pick(p, 'permitNo', 'numer_zgloszenia', 'numer', 'nr'));
      const owner = str(pick(p, 'owner', 'wlasciciel', 'właściciel'));
      const validUntil = parseDate(pick(p, 'validUntil', 'wazna_do', 'ważna_do', 'waznaDo'));
      if (permitNo) zone.permitNo = permitNo;
      if (owner) zone.owner = owner;
      if (validUntil) zone.validUntil = validUntil;
    }
    zones.push(zone);
  }
  if (zones.length === 0 && metric > 0) throw new ImportError(CRS_HINT);
  if (zones.length === 0) throw new ImportError('W pliku nie ma poligonów');
  return { zones, skipped: features.length - zones.length };
}
