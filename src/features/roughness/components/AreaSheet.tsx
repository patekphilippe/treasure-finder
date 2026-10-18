import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { createPoint, usePointsStore } from '@/features/points';
import { bottomSheetOffset } from '@/shared/lib/bottomSheetOffset';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { useUiStore } from '@/shared/store/useUiStore';
import { ConfirmDialog, Icon, Sheet, useToastStore } from '@/shared/ui';
import { LOAD_SHEET_HINT } from '../config/places';
import { useAreasStore } from '../store/useAreasStore';
import { describeShape } from '../utils/describeShape';

interface AreaSheetProps {
  onClose: () => void;
}

/** A place marked by the uneven-ground map: shape, note, point to check. No interpretation. */
export function AreaSheet({ onClose }: AreaSheetProps) {
  const id = useUiStore((s) => s.selectedAreaId);
  const area = useAreasStore((s) => s.areas.find((a) => a.id === id));
  const { update, remove } = useAreasStore();
  const flyTo = useMapViewStore((s) => s.flyTo);
  const showToast = useToastStore((s) => s.show);
  const [note, setNote] = useState(area?.note ?? '');
  const [confirm, setConfirm] = useState(false);
  if (!area) return null;

  const addPoint = async () => {
    const name = `Obszar ${area.no}`;
    await usePointsStore.getState().save(
      createPoint(
        {
          type: 'sprawdzic',
          name,
          desc: [`Teren nierówny: ${describeShape(area)}`, area.note].filter(Boolean).join('. '),
          depthCm: null,
          lat: area.lat,
          lng: area.lng,
          accM: null,
          src: 'analiza',
          photoId: null,
        },
        Date.now(),
      ),
    );
    showToast(`Dodano punkt: ${name}`);
  };

  return (
    <Sheet title={`Obszar ${area.no}`} onClose={onClose}>
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Dużo drobnych nierówności: {describeShape(area)}.
        </Typography>
        <Alert severity="info" icon={<Icon name="info-circle" size={18} />}>
          {LOAD_SHEET_HINT}
        </Alert>
        <TextField
          size="small"
          label="Notatka"
          multiline
          minRows={2}
          value={note}
          placeholder="np. widać leje na SVF, sprawdzić wiosną"
          onChange={(e) => setNote(e.target.value)}
          onBlur={() =>
            note !== area.note && void update({ ...area, note: note.trim(), updated: Date.now() })
          }
        />
        <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
          <Button
            variant="contained"
            sx={{ flex: 1 }}
            startIcon={<Icon name="map-marker-alt" size={18} />}
            onClick={addPoint}
          >
            Dodaj punkt
          </Button>
          <IconButton
            aria-label="Pokaż na mapie"
            onClick={() =>
              flyTo({ lat: area.lat, lng: area.lng, zoom: 17, offsetY: bottomSheetOffset() })
            }
          >
            <Icon name="search" size={22} />
          </IconButton>
          <IconButton aria-label="Usuń obszar" color="error" onClick={() => setConfirm(true)}>
            <Icon name="trash-alt" size={22} />
          </IconButton>
        </Stack>
      </Stack>
      <ConfirmDialog
        open={confirm}
        title={`Usunąć obszar ${area.no}?`}
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          await remove(area.id);
          setConfirm(false);
          onClose();
        }}
      />
    </Sheet>
  );
}
