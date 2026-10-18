import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useFieldStore } from '@/shared/store/useFieldStore';
import { usePointDraftStore } from '@/shared/store/usePointDraftStore';
import { Icon } from '@/shared/ui';

/** Where the new point goes: current GPS fix, map crosshair, or a long-pressed spot. */
export function LocationPicker() {
  const { source, location, setSource, startPicking } = usePointDraftStore();
  const position = useFieldStore((s) => s.position);

  const coords = location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : null;
  let info: string;
  if (source === 'gps')
    info = position ? `Bieżąca pozycja ±${Math.round(position.accM)} m` : 'Czekam na sygnał GPS…';
  else if (source === 'map') info = `Wskazane na mapie: ${coords}`;
  else info = coords ? `Celownik: ${coords}` : 'Ustaw celownik na mapie';

  return (
    <Stack data-tour="location-picker" spacing={1}>
      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        value={source === 'map' ? 'crosshair' : source}
        onChange={(_, value: 'gps' | 'crosshair' | null) => {
          if (value === 'gps') setSource('gps');
          if (value === 'crosshair') startPicking();
        }}
        sx={{ bgcolor: 'action.hover', p: 0.5, borderRadius: 999 }}
      >
        <ToggleButton value="gps" sx={{ gap: 0.75 }}>
          <Icon name="location-arrow" size={18} />
          GPS
        </ToggleButton>
        <ToggleButton value="crosshair" sx={{ gap: 0.75 }}>
          <Icon name="crosshairs" size={18} />
          Na mapie
        </ToggleButton>
      </ToggleButtonGroup>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, minHeight: 32 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          {info}
        </Typography>
        {source !== 'gps' && (
          <Button size="small" onClick={startPicking}>
            Zmień
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
