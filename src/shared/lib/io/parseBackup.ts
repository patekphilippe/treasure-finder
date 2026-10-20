import type { Candidate, ContextFeature, FieldPoint, Track, Zone } from '@/shared/types/domain';
import { BACKUP_VERSION } from './backup';
import { isRecord, num } from './guards';
import { normalizeContext } from './normalizeContext';
import { normalizePoint } from './normalizePoint';
import { normalizeTrack } from './normalizeTrack';

export interface ParsedBackup {
  version: number;
  points: FieldPoint[];
  tracks: Track[];
  candidates: Candidate[];
  zones: Zone[];
  context: ContextFeature[];
  /** records that could not be read */
  skipped: number;
}

export class ImportError extends Error {}

const withId = <T>(list: unknown): T[] =>
  Array.isArray(list) ? (list.filter((x) => isRecord(x) && typeof x.id === 'string') as T[]) : [];

/** Reads kopia.json of version 1, 2 or 3 (3: archival objects with the maps they were seen on). */
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

  return {
    version,
    points,
    tracks,
    candidates: withId<Candidate>(json.candidates),
    zones: withId<Zone>(json.zones),
    context: normalizeContext(json.context),
    skipped: rawPoints.length - points.length + (rawTracks.length - tracks.length),
  };
}
