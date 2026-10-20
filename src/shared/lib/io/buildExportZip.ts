import JSZip from 'jszip';
import {
  BACKUP_VERSION,
  mapPath,
  photoPath,
  ZIP_FILES,
  type BackupV4,
  type ExportData,
} from './backup';
import { toCandidatesGeoJSON } from './toCandidatesGeoJSON';
import { toFindsCsv } from './toFindsCsv';
import { toGpx } from './toGpx';
import { toPointsGeoJSON } from './toPointsGeoJSON';
import { toSearchZonesGeoJSON } from './toSearchZonesGeoJSON';
import { toTracksGeoJSON } from './toTracksGeoJSON';
import { toZonesGeoJSON } from './toZonesGeoJSON';

/**
 * Builds the export archive: GeoJSON layers and GPX for QGIS, photos, own maps,
 * and kopia.json (wersja 4) for a lossless re-import.
 */
export async function buildExportZip(
  data: ExportData,
  photos: ReadonlyMap<string, Blob>,
  now: number,
): Promise<JSZip> {
  const zip = new JSZip();
  const json = (value: unknown) => JSON.stringify(value, null, 2);
  const backup: BackupV4 = {
    wersja: BACKUP_VERSION,
    utworzono: new Date(now).toISOString(),
    ...data,
    maps: data.maps.map(({ image, ...map }) => ({ ...map, image: mapPath(map.id, image.type) })),
  };

  zip.file(ZIP_FILES.backup, json(backup));
  zip.file(ZIP_FILES.points, json(toPointsGeoJSON(data.points)));
  zip.file(ZIP_FILES.candidates, json(toCandidatesGeoJSON(data.candidates)));
  zip.file(ZIP_FILES.searchZones, json(toSearchZonesGeoJSON(data.candidates)));
  zip.file(ZIP_FILES.tracks, json(toTracksGeoJSON(data.tracks)));
  zip.file(ZIP_FILES.zones, json(toZonesGeoJSON(data.zones)));
  zip.file(ZIP_FILES.gpx, toGpx(data.points, data.tracks));
  zip.file(ZIP_FILES.finds, toFindsCsv(data.points));
  zip.folder(ZIP_FILES.photosDir);
  for (const [id, blob] of photos) {
    zip.file(photoPath(id), new Uint8Array(await blob.arrayBuffer()), { binary: true });
  }
  zip.folder(ZIP_FILES.mapsDir);
  for (const map of data.maps) {
    // WebP is compressed already: stored as is, so a phone does not spend time on it
    zip.file(mapPath(map.id, map.image.type), new Uint8Array(await map.image.arrayBuffer()), {
      binary: true,
      compression: 'STORE',
    });
  }
  return zip;
}
