import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { createPoint, usePointsStore } from '@/features/points';
import { bottomSheetOffset } from '@/shared/lib/bottomSheetOffset';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { useUiStore } from '@/shared/store/useUiStore';
import { ConfirmDialog, Icon, Sheet, useToastStore } from '@/shared/ui';
import { AREA_CATEGORIES } from '../config/areaCategories';
import { useAreasStore } from '../store/useAreasStore';
import { describeShape } from '../utils/describeShape';
import { suggestCategory } from '../utils/suggestCategory';
import { CategoryPicker } from './CategoryPicker';

interface AreaSheetProps {
  onClose: () => void;
}

/** A place marked by the uneven-ground analysis: recognised type, category, note, actions. */
export function AreaSheet({ onClose }: AreaSheetProps) {
  const id = useUiStore((s) => s.selectedAreaId);
  const area = useAreasStore((s) => s.areas.find((a) => a.id === id));
  const { setCategory, update, remove } = useAreasStore();
  const flyTo = useMapViewStore((s) => s.flyTo);
  const showToast = useToastStore((s) => s.show);
  const [note, setNote] = useState(area?.note ?? '');
  const [confirm, setConfirm] = useState(false);
  if (!area) return null;

  const meta = AREA_CATEGORIES[area.category];
  const recognised = AREA_CATEGORIES[suggestCategory(area.areaM2, area.elongation)];

  const addPoint = async () => {
    const points = usePointsStore.getState();
    const name = `${meta.label} ${area.no}`;
    await points.save(
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
    <Sheet title={`Miejsce ${area.no}`} onClose={onClose}>
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="subtitle2" sx={{ color: meta.color }}>
            {meta.label}
            {area.auto && ' (rozpoznane automatycznie)'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {describeShape(area)}. Kształt wskazuje na: {recognised.label.toLowerCase()} (
            {recognised.hint}).
          </Typography>
        </Stack>
        <Stack spacing={1}>
          <Typography variant="overline" color="text.secondary">
            Kategoria
          </Typography>
          <CategoryPicker value={area.category} onChange={(c) => void setCategory(area.id, c)} />
          <Typography variant="caption" color="text.secondary">
            {meta.hint}
          </Typography>
        </Stack>
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
        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            sx={{ flex: 1 }}
            startIcon={<Icon name="map-marker-alt" size={18} />}
            onClick={addPoint}
          >
            Punkt do sprawdzenia
          </Button>
          <Button
            color="inherit"
            startIcon={<Icon name="search" size={18} />}
            onClick={() =>
              flyTo({ lat: area.lat, lng: area.lng, zoom: 17, offsetY: bottomSheetOffset() })
            }
          >
            Pokaż
          </Button>
          <Button
            color="error"
            startIcon={<Icon name="trash-alt" size={18} />}
            onClick={() => setConfirm(true)}
          >
            Usuń
          </Button>
        </Stack>
      </Stack>
      <ConfirmDialog
        open={confirm}
        title={`Usunąć miejsce ${area.no}?`}
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
