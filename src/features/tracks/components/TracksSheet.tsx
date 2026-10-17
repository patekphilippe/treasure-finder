import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useZoneAlertStore } from '@/features/zones';
import { formatDate } from '@/shared/lib/format';
import { useFieldStore } from '@/shared/store/useFieldStore';
import type { Track } from '@/shared/types/domain';
import { ConfirmDialog, EmptyState, Sheet, useToastStore } from '@/shared/ui';
import { trackRecorder } from '../services/trackRecorder';
import { useTracksStore } from '../store/useTracksStore';
import { RecordingPanel } from './RecordingPanel';
import { TrackListItem } from './TrackListItem';

interface TracksSheetProps {
  onClose: () => void;
}

export function TracksSheet({ onClose }: TracksSheetProps) {
  const tracks = useTracksStore((s) => s.tracks);
  const removeTrack = useTracksStore((s) => s.remove);
  const recordingId = useFieldStore((s) => s.recordingTrackId);
  const showToast = useToastStore((s) => s.show);
  const [toDelete, setToDelete] = useState<Track | null>(null);
  const [startWarning, setStartWarning] = useState<string | null>(null);

  const active = tracks.find((t) => t.id === recordingId) ?? null;
  const saved = tracks.filter((t) => t.id !== recordingId);

  const startNow = async () => {
    setStartWarning(null);
    await trackRecorder.start();
    showToast('Nagrywanie trasy rozpoczęte');
  };
  const start = () => {
    // legal check: the plan requires a warning when a track starts outside a valid permit zone
    const alert = useZoneAlertStore.getState().alert;
    if (alert?.kind === 'zakaz') setStartWarning(`Jesteś w strefie zakazu: ${alert.zone.name}.`);
    else if (alert?.kind === 'zgoda_wygasla')
      setStartWarning(
        `Zgoda dla „${alert.zone.name}” wygasła${alert.zone.validUntil ? ` ${formatDate(alert.zone.validUntil)}` : ''}.`,
      );
    else if (alert?.kind === 'poza_zgoda')
      setStartWarning('Trasa zaczyna się poza strefą ze zgodą właściciela.');
    else void startNow();
  };
  const stop = async () => {
    await trackRecorder.stop();
    showToast('Trasa zapisana');
  };
  const confirmDelete = async () => {
    if (toDelete) await removeTrack(toDelete.id);
    setToDelete(null);
  };

  return (
    <Sheet title="Trasa" onClose={onClose}>
      <Stack spacing={2.5}>
        <RecordingPanel track={active} onStart={start} onStop={stop} />
        <Stack>
          <Typography variant="overline" color="text.secondary">
            Zapisane trasy
          </Typography>
          {saved.length === 0 ? (
            <EmptyState
              icon="route"
              title="Brak zapisanych tras"
              description="Zakończone trasy pojawią się tutaj i na mapie."
            />
          ) : (
            saved.map((track) => (
              <TrackListItem key={track.id} track={track} onDelete={() => setToDelete(track)} />
            ))
          )}
        </Stack>
      </Stack>
      <ConfirmDialog
        open={startWarning !== null}
        title="Poza ważną strefą zgody"
        message={`${startWarning ?? ''} Poszukiwania wymagają zgłoszenia i zgody właściciela gruntu.`}
        confirmLabel="Rozpocznij mimo to"
        onConfirm={startNow}
        onCancel={() => setStartWarning(null)}
      />
      <ConfirmDialog
        open={toDelete !== null}
        title="Usunąć trasę?"
        message={toDelete?.name}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </Sheet>
  );
}
