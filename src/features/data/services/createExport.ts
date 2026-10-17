import { trackRecorder } from '@/features/tracks';
import { buildExportZip } from '@/shared/lib/io';
import { exportFileName } from '../utils/exportFileName';
import { readExportData } from './readExportData';

export interface ExportResult {
  file: File;
  counts: { points: number; tracks: number; photos: number };
}

/** Saves the recording in progress, then packs the whole database into a ZIP file. */
export async function createExport(now = Date.now()): Promise<ExportResult> {
  await trackRecorder.flush();
  const { data, photos } = await readExportData();
  const zip = await buildExportZip(data, photos, now);
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  return {
    file: new File([blob], exportFileName(now), { type: 'application/zip' }),
    counts: { points: data.points.length, tracks: data.tracks.length, photos: photos.size },
  };
}
