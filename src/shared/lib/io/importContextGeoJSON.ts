import type { ContextFeature } from '@/shared/types/domain';
import { contentId } from './contentId';
import { isRecord, str } from './guards';
import { CRS_HINT } from './importGeoJSON';
import { ImportError } from './parseBackup';
import { readGeoFeatures } from './readGeoFeatures';

export const CONTEXT_KIND_VALUES: readonly ContextFeature['kind'][] = [
  'osada',
  'droga',
  'mlyn',
  'karczma',
  'brod',
  'inne',
];

/** "Młyn", "BRÓD" → mlyn, brod; null when not a context kind. */
export function contextKind(v: unknown): ContextFeature['kind'] | null {
  const k = str(v).trim().toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[̀-ͯ]/g, '');
  return (CONTEXT_KIND_VALUES as readonly string[]).includes(k)
    ? (k as ContextFeature['kind'])
    : null;
}

const kindOf = (f: unknown) =>
  isRecord(f) && isRecord(f.properties) ? contextKind(f.properties.kind) : null;

/** A GeoJSON of archival context: at least one feature has a `kind` from the specification. */
export function isContextGeoJSON(json: unknown): boolean {
  if (!isRecord(json)) return false;
  if (json.type === 'Feature') return kindOf(json) !== null;
  return Array.isArray(json.features) && json.features.some((f) => kindOf(f) !== null);
}

/** Features drawn in QGIS on archival maps (EPSG:4326, field `kind`) → context features. */
export function importContextGeoJSON(
  json: unknown,
  source: string,
): { context: ContextFeature[]; skipped: number } {
  const { features, metric, all } = readGeoFeatures(json);
  const context: ContextFeature[] = [];
  for (const { geometry, properties } of features) {
    const kind = contextKind(properties.kind);
    if (!kind) continue;
    context.push({
      id: contentId('kontekst', kind + JSON.stringify(geometry)),
      kind,
      geometry,
      source,
    });
  }
  if (context.length === 0 && metric > 0) throw new ImportError(CRS_HINT);
  return { context, skipped: all - context.length };
}
