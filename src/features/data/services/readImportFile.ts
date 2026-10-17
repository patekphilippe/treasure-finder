import { createId } from '@/shared/lib/createId';
import type { ImportBundle } from '@/shared/lib/io';

export interface ImportPayload extends Omit<ImportBundle, 'version'> {
  kind: 'backup-v1' | 'backup-v2' | 'geojson';
}

const isZip = (bytes: Uint8Array) => bytes[0] === 0x50 && bytes[1] === 0x4b; // "PK"

/** Detects the file type (ZIP backup, kopia.json or GeoJSON) and parses it. */
export async function readImportFile(file: File, now = Date.now()): Promise<ImportPayload> {
  // JSZip & co. load only when importing
  const { importGeoJSON, ImportError, importZip, parseBackup } = await import('@/shared/lib/io');
  const buffer = await file.arrayBuffer();
  if (isZip(new Uint8Array(buffer, 0, Math.min(2, buffer.byteLength)))) {
    const { version, ...bundle } = await importZip(buffer);
    return { kind: version === 1 ? 'backup-v1' : 'backup-v2', ...bundle };
  }

  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder().decode(buffer));
  } catch {
    throw new ImportError('Nieobsługiwany plik — wybierz kopię ZIP, kopia.json albo GeoJSON');
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
      photos: new Map(),
      skipped: skipped + rejected,
    };
  }
  const { version, ...backup } = parseBackup(json);
  return { kind: version === 1 ? 'backup-v1' : 'backup-v2', ...backup, photos: new Map() };
}
