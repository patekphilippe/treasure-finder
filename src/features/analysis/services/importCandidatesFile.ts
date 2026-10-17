import { candidatesRepo } from '@/shared/db';
import { useAnalysisStore } from '../store/useAnalysisStore';

export interface CandidatesImportResult {
  added: number;
  updated: number;
  skipped: number;
  /** best-scored imported candidate, to show the area on the map */
  center: { lat: number; lng: number } | null;
}

/** kandydaci.geojson from QGIS → IndexedDB, keeping decisions and notes made here. */
export async function importCandidatesFile(file: File): Promise<CandidatesImportResult> {
  const { importCandidatesGeoJSON, mergeCandidates, ImportError } = await import('@/shared/lib/io');
  let json: unknown;
  try {
    json = JSON.parse(await file.text());
  } catch {
    throw new ImportError('Plik nie jest poprawnym GeoJSON');
  }
  const { candidates, skipped } = importCandidatesGeoJSON(json);
  const merged = mergeCandidates(await candidatesRepo.getAll(), candidates);
  await candidatesRepo.putMany(merged.toWrite);
  await useAnalysisStore.getState().load();
  const best = candidates.reduce<(typeof candidates)[number] | null>(
    (top, c) => (!top || c.score > top.score ? c : top),
    null,
  );
  const center = best ? { lat: best.lat, lng: best.lng } : null;
  return { added: merged.added, updated: merged.updated, skipped, center };
}
