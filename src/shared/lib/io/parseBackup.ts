import type { Candidate, ContextFeature, FieldPoint, Track, Zone } from '@/shared/types/domain';
import { BACKUP_VERSION, type OwnMapEntry } from './backup';
import { isRecord, num } from './guards';
import { normalizeContext } from './normalizeContext';
import { normalizeMapEntry } from './normalizeMapEntry';
import { normalizePoint } from './normalizePoint';
import { normalizeTrack } from './normalizeTrack';

export interface ParsedBackup {
  version: number;
  points: FieldPoint[];
  tracks: Track[];
  candidates: Candidate[];
  zones: Zone[];
  context: ContextFeature[];
  /** own maps (wersja 4); their images are read from the ZIP */
  maps: OwnMapEntry[];
  /** records that could not be read */
  skipped: number;
}

export class ImportError extends Error {}

const withId = <T>(list: unknown): T[] =>
  Array.isArray(list) ? (list.filter((x) => isRecord(x) && typeof x.id === 'string') as T[]) : [];

/**
 * Reads kopia.json of version 1 to 4 (3: archival objects with the maps they were seen on,
 * 4: own historical maps).
 */
export function parseBackup(json: unknown): ParsedBackup {
  if (!isRecord(json) || (!Array.isArray(json.points) && !Array.isArray(json.tracks))) {
    throw new ImportError('To nie jest kopia aplikacji (brak punktów i tras)');
  }
  const version = num(json.wersja) ?? 1;
  if (version > BACKUP_VERSION) {
    throw new ImportError(`Kopia pochodzi z nowszej wersji aplikacji (wersja ${version})`);
  }
  const rawPoints = Array.isArray(json.points) ? json.points : [];
  const rawTracks = Array.isArray(json.tracks) ? json.tracks : [];
  const points = rawPoints.map(normalizePoint).filter((p): p is FieldPoint => p !== null);
  const tracks = rawTracks.map(normalizeTrack).filter((t): t is Track => t !== null);
  const rawMaps = Array.isArray(json.maps) ? json.maps : [];
  const maps = rawMaps.map(normalizeMapEntry).filter((m): m is OwnMapEntry => m !== null);

  return {
    version,
    points,
    tracks,
    candidates: withId<Candidate>(json.candidates),
    zones: withId<Zone>(json.zones),
    context: normalizeContext(json.context),
    maps,
    skipped:
      rawPoints.length -
      points.length +
      (rawTracks.length - tracks.length) +
      (rawMaps.length - maps.length),
  };
}
