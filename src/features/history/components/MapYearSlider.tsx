import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { mapYears } from '../utils/mapYears';

/**
 * Warstwy: maps by year. The list picks any years (typing finds one), the slider a single year;
 * the maps of the chosen years are shown, the others hidden, and only the objects read from them
 * stand out. An empty choice ("Wszystkie") goes back to the switches.
 */
export function MapYearSlider() {
  const maps = useOwnMapsStore((s) => s.maps);
  const chosen = useOwnMapsStore((s) => s.years);
  const setYears = useOwnMapsStore((s) => s.setYears);
  const years = useMemo(() => mapYears(maps), [maps]);
  const count = (y: number) => maps.filter((m) => m.year === y).length;
  if (!maps.length) return null;
  if (years.length < 2)
    return (
      <Typography variant="caption" color="text.secondary">
        Wybór lat pojawi się przy mapach z co najmniej dwóch lat
        {years.length ? ` (teraz: ${years[0]})` : ''}. Rok mapy wpiszesz w Danych → Własne mapy.
      </Typography>
    );

  return (
    <Stack data-tour="maps-year" spacing={0.75}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
        <Autocomplete
          multiple
          size="small"
          disableCloseOnSelect
          filterSelectedOptions
          options={years}
          value={chosen ?? []}
          getOptionLabel={(y) => String(y)}
          renderOption={({ key, ...props }, y) => (
            <li key={key} {...props}>
              {y} ({count(y) === 1 ? '1 mapa' : `${count(y)} mapy`})
            </li>
          )}
          onChange={(_, v) => setYears(v.length ? [...v].sort((a, b) => a - b) : null)}
          renderInput={(params) => (
            <TextField {...params} label="Lata map" placeholder={chosen ? '' : 'Wszystkie'} />
          )}
          sx={{ flex: 1 }}
        />
        <Chip
          size="small"
          label="Wszystkie"
          color={chosen === null ? 'primary' : 'default'}
          variant={chosen === null ? 'filled' : 'outlined'}
          onClick={() => setYears(null)}
        />
      </Stack>
      <Slider
        size="small"
        min={years[0]}
        max={years[years.length - 1]}
        step={null}
        marks={years.map((y) => ({ value: y, label: String(y) }))}
        // several years on the list: the slider rests on the first, moving it picks one again
        value={chosen?.[0] ?? years[0]!}
        onChange={(_, v) => setYears([v as number])}
        aria-label="Rok mapy"
        sx={{ mx: 1, width: 'auto' }}
      />
    </Stack>
  );
}
