import { trackRecorder } from '@/features/tracks';
import { exportFileName } from '../utils/exportFileName';
import { readExportData } from './readExportData';

export interface ExportResult {
  file: File;
  counts: { points: number; tracks: number; photos: number };
}

/** Saves the recording in progress, then packs the whole database into a ZIP file. */
export async function createExport(now = Date.now()): Promise<ExportResult> {
  await trackRecorder.flush();
  const [{ buildExportZip }, { data, photos }] = await Promise.all([
    import('@/shared/lib/io'),
    readExportData(),
  ]);
  const zip = await buildExportZip(data, photos, now);
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  return {
    file: new File([blob], exportFileName(now), { type: 'application/zip' }),
    counts: { points: data.points.length, tracks: data.tracks.length, photos: photos.size },
  };
}
