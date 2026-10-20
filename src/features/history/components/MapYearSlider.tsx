import Chip from '@mui/material/Chip';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { mapYears } from '../utils/mapYears';

/**
 * Warstwy: one year at a time. The own maps of that year are shown (the others hidden) and only the
 * objects read from maps of that year stand out; "Wszystkie" goes back to the switches.
 */
export function MapYearSlider() {
  const maps = useOwnMapsStore((s) => s.maps);
  const year = useOwnMapsStore((s) => s.yearFilter);
  const setYear = useOwnMapsStore((s) => s.setYearFilter);
  const years = useMemo(() => mapYears(maps), [maps]);
  if (years.length < 2) return null;

  return (
    <Stack data-tour="maps-year" spacing={0.25}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" sx={{ flex: 1 }}>
          Rok mapy: <b>{year ?? 'wszystkie'}</b>
        </Typography>
        <Chip
          size="small"
          label="Wszystkie"
          color={year === null ? 'primary' : 'default'}
          variant={year === null ? 'filled' : 'outlined'}
          onClick={() => setYear(null)}
        />
      </Stack>
      <Slider
        size="small"
        min={years[0]}
        max={years[years.length - 1]}
        step={null}
        marks={years.map((y) => ({ value: y, label: String(y) }))}
        value={year ?? years[0]!}
        onChange={(_, v) => setYear(v as number)}
        aria-label="Rok mapy"
        sx={{ mx: 1, width: 'auto' }}
      />
    </Stack>
  );
}
