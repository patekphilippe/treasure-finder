import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { usePointsStore } from '@/features/points';
import { useTracksStore } from '@/features/tracks';
import { countPhotos, countPoints, countTracks } from '@/shared/lib/format';
import { Icon, useToastStore } from '@/shared/ui';
import { createExport } from '../services/createExport';
import { canShareFiles } from '../utils/canShareFiles';
import { downloadBlob } from '../utils/downloadBlob';

export function ExportSection() {
  const pointCount = usePointsStore((s) => s.points.length);
  const trackCount = useTracksStore((s) => s.tracks.length);
  const showToast = useToastStore((s) => s.show);
  const [busy, setBusy] = useState<'download' | 'share' | null>(null);

  const run = async (mode: 'download' | 'share') => {
    setBusy(mode);
    try {
      const { file, counts } = await createExport();
      if (mode === 'share') await navigator.share({ files: [file], title: file.name });
      else downloadBlob(file);
      showToast(
        `Eksport: ${countPoints(counts.points)}, ${countTracks(counts.tracks)}, ${countPhotos(counts.photos)}`,
      );
    } catch (e) {
      if ((e as Error).name !== 'AbortError') showToast('Eksport nie powiódł się');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Stack spacing={1.25}>
      <Typography variant="overline" color="text.secondary">
        Eksport
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {countPoints(pointCount)} i {countTracks(trackCount)} w jednym pliku ZIP: GeoJSON i GPX do
        QGIS, zdjęcia oraz kopia do przeniesienia na inne urządzenie.
      </Typography>
      <Stack direction="row" sx={{ gap: 1 }}>
        <Button
          variant="contained"
          sx={{ flex: 1 }}
          disabled={busy !== null}
          startIcon={
            busy === 'download' ? (
              <CircularProgress size={16} />
            ) : (
              <Icon name="download" size={20} />
            )
          }
          onClick={() => run('download')}
        >
          Pobierz kopię ZIP
        </Button>
        {canShareFiles() && (
          <Button
            variant="outlined"
            color="inherit"
            disabled={busy !== null}
            startIcon={<Icon name="share-alt" size={20} />}
            onClick={() => run('share')}
          >
            Udostępnij
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
