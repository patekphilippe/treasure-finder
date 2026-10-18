import { createId } from '@/shared/lib/createId';
import type { ImportBundle } from '@/shared/lib/io';
import type { WaterFeature } from '@/shared/types/domain';

export interface ImportPayload extends Omit<ImportBundle, 'version'> {
  kind: 'backup-v1' | 'backup-v2' | 'geojson' | 'candidates' | 'context' | 'water';
  /** BDOT10k water (only from a water GeoJSON, never in a backup) */
  water: WaterFeature[];
  /** drainage ditches left out of a water GeoJSON */
  ditches?: number;
}

const EMPTY = { points: [], tracks: [], candidates: [], zones: [], context: [], water: [] };

const isZip = (bytes: Uint8Array) => bytes[0] === 0x50 && bytes[1] === 0x4b; // "PK"

/**
 * Detects the file type and parses it: ZIP backup, kopia.json, candidates GeoJSON, archival
 * context GeoJSON (field `kind`), BDOT10k water GeoJSON or points GeoJSON.
 */
export async function readImportFile(file: File, now = Date.now()): Promise<ImportPayload> {
  // JSZip & co. load only when importing
  const {
    importCandidatesGeoJSON,
    importContextGeoJSON,
    importGeoJSON,
    ImportError,
    importWaterGeoJSON,
    importZip,
    isCandidatesGeoJSON,
    isContextGeoJSON,
    isWaterGeoJSON,
    parseBackup,
  } = await import('@/shared/lib/io');
  const buffer = await file.arrayBuffer();
  if (isZip(new Uint8Array(buffer, 0, Math.min(2, buffer.byteLength)))) {
    const { version, ...bundle } = await importZip(buffer);
    return { kind: version === 1 ? 'backup-v1' : 'backup-v2', ...bundle, water: [] };
  }

  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder().decode(buffer));
  } catch {
    throw new ImportError('Nieobsługiwany plik. Wybierz kopię ZIP, kopia.json albo GeoJSON');
  }
  if (isCandidatesGeoJSON(json)) {
    const { candidates, skipped } = importCandidatesGeoJSON(json);
    return { ...EMPTY, kind: 'candidates', candidates, photos: new Map(), skipped };
  }
  if (isContextGeoJSON(json)) {
    const { context, skipped } = importContextGeoJSON(json, file.name);
    return { ...EMPTY, kind: 'context', context, photos: new Map(), skipped };
  }
  if (isWaterGeoJSON(json)) {
    const { water, ditches, skipped } = importWaterGeoJSON(json, file.name);
    return { ...EMPTY, kind: 'water', water, ditches, photos: new Map(), skipped };
  }
  const type = (json as { type?: unknown } | null)?.type;
  if (type === 'FeatureCollection' || type === 'Feature') {
    const { points, rejected, skipped } = importGeoJSON(json, now, createId);
    return {
      kind: 'geojson',
      points,
      tracks: [],
      candidates: [],
      zones: [],
      context: [],
      water: [],
      photos: new Map(),
      skipped: skipped + rejected,
    };
  }
  const { version, ...backup } = parseBackup(json);
  return {
    kind: version === 1 ? 'backup-v1' : 'backup-v2',
    ...backup,
    water: [],
    photos: new Map(),
  };
}
