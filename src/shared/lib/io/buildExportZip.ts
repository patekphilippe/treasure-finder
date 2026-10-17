import JSZip from 'jszip';
import { BACKUP_VERSION, photoPath, ZIP_FILES, type BackupV2, type ExportData } from './backup';
import { toCandidatesGeoJSON } from './toCandidatesGeoJSON';
import { toFindsCsv } from './toFindsCsv';
import { toGpx } from './toGpx';
import { toPointsGeoJSON } from './toPointsGeoJSON';
import { toTracksGeoJSON } from './toTracksGeoJSON';
import { toZonesGeoJSON } from './toZonesGeoJSON';

/**
 * Builds the export archive: GeoJSON layers and GPX for QGIS, photos,
 * and kopia.json (wersja 2) for a lossless re-import.
 */
export async function buildExportZip(
  data: ExportData,
  photos: ReadonlyMap<string, Blob>,
  now: number,
): Promise<JSZip> {
  const zip = new JSZip();
  const json = (value: unknown) => JSON.stringify(value, null, 2);
  const backup: BackupV2 = {
    wersja: BACKUP_VERSION,
    utworzono: new Date(now).toISOString(),
    ...data,
  };

  zip.file(ZIP_FILES.backup, json(backup));
  zip.file(ZIP_FILES.points, json(toPointsGeoJSON(data.points)));
  zip.file(ZIP_FILES.candidates, json(toCandidatesGeoJSON(data.candidates)));
  zip.file(ZIP_FILES.tracks, json(toTracksGeoJSON(data.tracks)));
  zip.file(ZIP_FILES.zones, json(toZonesGeoJSON(data.zones)));
  zip.file(ZIP_FILES.gpx, toGpx(data.points, data.tracks));
  zip.file(ZIP_FILES.finds, toFindsCsv(data.points));
  zip.folder(ZIP_FILES.photosDir);
  for (const [id, blob] of photos) {
    zip.file(photoPath(id), new Uint8Array(await blob.arrayBuffer()), { binary: true });
  }
  return zip;
}
