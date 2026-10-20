import { usePointsStore } from '@/features/points';
import { useTracksStore } from '@/features/tracks';
import { useZonesStore } from '@/features/zones';
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
  contextAdded: number;
  mapsAdded: number;
  waterAdded: number;
  /** drainage ditches left out of a water file */
  ditches: number;
  photos: number;
  unchanged: number;
  skipped: number;
}

const trackTime = (t: Track) => t.end ?? t.start;

/**
 * Merges imported data into IndexedDB by id:
 * points — newer `updated` wins; tracks — later `end` wins, a track being
 * recorded here is never overwritten; candidates — new data, but decisions and notes made
 * here are kept; zones/context/own maps/water — only new ids.
 */
export async function applyImport(payload: ImportPayload): Promise<ImportSummary> {
  const db = await getDb();
  const [points, tracks, candidates, zones, context, maps, water, photoKeys] = await Promise.all([
    db.getAll('points'),
    db.getAll('tracks'),
    db.getAll('candidates'),
    db.getAll('zones'),
    db.getAll('context'),
    db.getAll('maps'),
    db.getAll('water'),
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
  const m = mergeRecords(maps, payload.maps, onlyNew);
  const w = mergeRecords(water, payload.water, onlyNew);

  const havePhoto = new Set(photoKeys);
  const photos = p.toWrite.flatMap((pt) =>
    pt.photoId && !havePhoto.has(pt.photoId) && payload.photos.has(pt.photoId)
      ? [[pt.photoId, payload.photos.get(pt.photoId) as Blob] as const]
      : [],
  );

  const tx = db.transaction(
    ['points', 'tracks', 'candidates', 'zones', 'context', 'maps', 'water', 'photos'],
    'readwrite',
  );
  await Promise.all([
    ...p.toWrite.map((r) => tx.objectStore('points').put(r)),
    ...t.toWrite.map((r) => tx.objectStore('tracks').put(r)),
    ...c.toWrite.map((r) => tx.objectStore('candidates').put(r)),
    ...z.toWrite.map((r) => tx.objectStore('zones').put(r)),
    ...x.toWrite.map((r) => tx.objectStore('context').put(r)),
    ...m.toWrite.map((r) => tx.objectStore('maps').put(r)),
    ...w.toWrite.map((r) => tx.objectStore('water').put(r)),
    ...photos.map(([id, blob]) => tx.objectStore('photos').put(blob, id)),
    tx.done,
  ]);

  await Promise.all([
    usePointsStore.getState().load(),
    useTracksStore.getState().load(),
    useZonesStore.getState().load(),
  ]);
  // history (with its Leaflet layers) loads only when own maps came in
  if (m.added) await (await import('@/features/history')).useOwnMapsStore.getState().load();

  return {
    pointsAdded: p.added,
    pointsUpdated: p.updated,
    tracksAdded: t.added,
    tracksUpdated: t.updated,
    candidatesAdded: c.added,
    candidatesUpdated: c.updated,
    contextAdded: x.added,
    mapsAdded: m.added,
    waterAdded: w.added,
    ditches: payload.ditches ?? 0,
    photos: photos.length,
    unchanged: p.unchanged + t.unchanged + x.unchanged + m.unchanged + w.unchanged,
    skipped: payload.skipped,
  };
}
