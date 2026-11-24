import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { usePointsStore } from '@/features/points';
import { useTracksStore } from '@/features/tracks';
import { countPhotos, countPoints, countTracks, pluralPl } from '@/shared/lib/format';
import { trackActivity } from '@/shared/store/trackActivity';
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
      const { file, counts } = await trackActivity(
        {
          id: 'export',
          label: 'Kopia ZIP',
          short: 'Kopia ZIP',
          step: 'Pakuję dane i zdjęcia',
          open: { mode: 'field', sheet: 'data' },
        },
        () => createExport(),
      );
      if (mode === 'share') await navigator.share({ files: [file], title: file.name });
      else downloadBlob(file);
      const maps = counts.maps ? `, ${pluralPl(counts.maps, 'mapa', 'mapy', 'map')}` : '';
      showToast(
        `Eksport: ${countPoints(counts.points)}, ${countTracks(counts.tracks)}, ${countPhotos(counts.photos)}${maps}`,
      );
    } catch (e) {
      if ((e as Error).name !== 'AbortError') showToast('Eksport nie powiódł się');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Stack
      data-tour="data-export"
      spacing={1.25}
      sx={{ bgcolor: 'action.hover', borderRadius: '12px', p: 1.5 }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
        <Icon name="download" size={22} />
        <Stack sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2">Zapisz kopię</Typography>
          <Typography variant="caption" color="text.secondary">
            {countPoints(pointCount)} i {countTracks(trackCount)} w jednym pliku ZIP. Otworzysz go
            też w QGIS.
          </Typography>
        </Stack>
      </Stack>
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
          Pobierz plik
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
