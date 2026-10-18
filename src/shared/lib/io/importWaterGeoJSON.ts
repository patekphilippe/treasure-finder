import type { WaterFeature } from '@/shared/types/domain';
import { contentId } from './contentId';
import { isRecord, str, type Raw } from './guards';
import { CRS_HINT } from './importGeoJSON';
import { ImportError } from './parseBackup';
import { readGeoFeatures } from './readGeoFeatures';

/** BDOT10k classes: rivers and streams, canals, drainage ditches, surface water. */
const BDOT_WATER = /^(OT_)?(SWRS|SWKN|SWRM|PTWP)/i;
/** drainage ditches are not the water a camp was set up by */
const DITCH = /^(OT_)?SWRM/i;

const code = (p: Raw) =>
  str(p.x_kod ?? p.X_KOD ?? p.layer ?? p.LAYER ?? p.warstwa).replace(/\.[^.]*$/, '');

/** 'water' (the class), 'ditch' or null when the feature is not BDOT10k water. */
function waterClass(p: Raw): 'water' | 'ditch' | null {
  if (str(p.kind).toLowerCase() === 'woda') return 'water';
  const c = code(p);
  if (!BDOT_WATER.test(c)) return null;
  return DITCH.test(c) ? 'ditch' : 'water';
}

/** A GeoJSON of water: features with a BDOT10k water code (x_kod or layer) or kind 'woda'. */
export function isWaterGeoJSON(json: unknown): boolean {
  if (!isRecord(json)) return false;
  const list: unknown[] =
    json.type === 'Feature' ? [json] : Array.isArray(json.features) ? json.features : [];
  return list.some((f) => isRecord(f) && isRecord(f.properties) && waterClass(f.properties));
}

/** BDOT10k water exported from QGIS (EPSG:4326) → water features; ditches are skipped. */
export function importWaterGeoJSON(
  json: unknown,
  source: string,
): { water: WaterFeature[]; ditches: number; skipped: number } {
  const { features, metric, all } = readGeoFeatures(json);
  const water: WaterFeature[] = [];
  let ditches = 0;
  for (const { geometry, properties } of features) {
    if (geometry.type === 'Point' || geometry.type === 'MultiPoint') continue;
    const cls = waterClass(properties);
    if (cls === 'ditch') ditches++;
    if (cls !== 'water') continue;
    water.push({ id: contentId('woda', JSON.stringify(geometry)), geometry, source });
  }
  if (water.length === 0 && metric > 0) throw new ImportError(CRS_HINT);
  return { water, ditches, skipped: all - water.length - ditches };
}
