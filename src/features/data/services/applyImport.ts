import { usePointsStore } from '@/features/points';
import { useTracksStore } from '@/features/tracks';
import { getDb } from '@/shared/db';
import { mergeCandidates } from '@/shared/lib/io/mergeCandidates';
import { mergeRecords } from '@/shared/lib/io/mergeRecords';
import type { Track } from '@/shared/types/domain';
import type { ImportPayload } from './readImportFile';

export interface ImportSummary {
  pointsAdded: number;
  pointsUpdated: number;
  tracksAdded: number;
  tracksUpdated: number;
  candidatesAdded: number;
  candidatesUpdated: number;
  photos: number;
  unchanged: number;
  skipped: number;
}

const trackTime = (t: Track) => t.end ?? t.start;

/**
 * Merges imported data into IndexedDB by id:
 * points — newer `updated` wins; tracks — later `end` wins, a track being
 * recorded here is never overwritten; candidates — new data, but decisions and notes made
 * here are kept; zones/context — only new ids.
 */
export async function applyImport(payload: ImportPayload): Promise<ImportSummary> {
  const db = await getDb();
  const [points, tracks, candidates, zones, context, photoKeys] = await Promise.all([
    db.getAll('points'),
    db.getAll('tracks'),
    db.getAll('candidates'),
    db.getAll('zones'),
    db.getAll('context'),
    db.getAllKeys('photos'),
  ]);

  const p = mergeRecords(points, payload.points, (a, b) => a.updated > b.updated);
  const t = mergeRecords(
    tracks,
    payload.tracks,
    (a, b) => !b.active && trackTime(a) > trackTime(b),
  );
  const onlyNew = () => false;
  const c = mergeCandidates(candidates, payload.candidates);
  const z = mergeRecords(zones, payload.zones, onlyNew);
  const x = mergeRecords(context, payload.context, onlyNew);

  const havePhoto = new Set(photoKeys);
  const photos = p.toWrite.flatMap((pt) =>
    pt.photoId && !havePhoto.has(pt.photoId) && payload.photos.has(pt.photoId)
      ? [[pt.photoId, payload.photos.get(pt.photoId) as Blob] as const]
      : [],
  );

  const tx = db.transaction(
    ['points', 'tracks', 'candidates', 'zones', 'context', 'photos'],
    'readwrite',
  );
  await Promise.all([
    ...p.toWrite.map((r) => tx.objectStore('points').put(r)),
    ...t.toWrite.map((r) => tx.objectStore('tracks').put(r)),
    ...c.toWrite.map((r) => tx.objectStore('candidates').put(r)),
    ...z.toWrite.map((r) => tx.objectStore('zones').put(r)),
    ...x.toWrite.map((r) => tx.objectStore('context').put(r)),
    ...photos.map(([id, blob]) => tx.objectStore('photos').put(blob, id)),
    tx.done,
  ]);

  await Promise.all([usePointsStore.getState().load(), useTracksStore.getState().load()]);

  return {
    pointsAdded: p.added,
    pointsUpdated: p.updated,
    tracksAdded: t.added,
    tracksUpdated: t.updated,
    candidatesAdded: c.added,
    candidatesUpdated: c.updated,
    photos: photos.length,
    unchanged: p.unchanged + t.unchanged,
    skipped: payload.skipped,
  };
}
