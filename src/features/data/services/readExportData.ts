import { getDb, photosRepo } from '@/shared/db';
import type { ExportData } from '@/shared/lib/io';

/** Everything that goes into the export, plus the photos referenced by points. */
export async function readExportData(): Promise<{ data: ExportData; photos: Map<string, Blob> }> {
  const db = await getDb();
  const [points, tracks, candidates, zones, context] = await Promise.all([
    db.getAll('points'),
    db.getAll('tracks'),
    db.getAll('candidates'),
    db.getAll('zones'),
    db.getAll('context'),
  ]);
  const photos = new Map<string, Blob>();
  for (const id of new Set(points.flatMap((p) => (p.photoId ? [p.photoId] : [])))) {
    const blob = await photosRepo.get(id);
    if (blob) photos.set(id, blob);
  }
  return { data: { points, tracks, candidates, zones, context }, photos };
}
