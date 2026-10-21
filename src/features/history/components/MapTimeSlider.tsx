import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ListSubheader from '@mui/material/ListSubheader';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';
import { HISTORICAL_LAYERS, useLayersStore } from '@/features/layers';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import type { OwnMap } from '@/shared/types/domain';
import { mapYears } from '../utils/mapYears';
import { shownMaps } from '../utils/shownMaps';
import { timeRange } from '../utils/timeRange';
import { timeSelection } from '../utils/timeSelection';

/**
 * Warstwy: the time slider over all historical maps. A year shows your maps of that year and the
 * online map covering it (an orthophoto of that year, a Messtischblatt edition…); the objects read
 * from maps of that year stand out. "Pokazane mapy" picks your maps to show (by name or year, a
 * whole year at once), the others are hidden; "Wyłącz" goes back to the switches.
 */
export function MapTimeSlider() {
  const maps = useOwnMapsStore((s) => s.maps);
  const chosen = useOwnMapsStore((s) => s.years);
  const timeYear = useOwnMapsStore((s) => s.timeYear);
  const setYears = useOwnMapsStore((s) => s.setYears);
  const setTimeYear = useOwnMapsStore((s) => s.setTimeYear);
  const update = useOwnMapsStore((s) => s.update);
  const range = useMemo(() => timeRange(maps, HISTORICAL_LAYERS), [maps]);
  const ownYears = useMemo(() => mapYears(maps), [maps]);
  // your maps by year (oldest first, those without a year last), then by name
  const sorted = useMemo(
    () =>
      [...maps].sort(
        (a, b) => (a.year ?? 9999) - (b.year ?? 9999) || a.name.localeCompare(b.name, 'pl'),
      ),
    [maps],
  );
  const shownList = useMemo(() => shownMaps(sorted, chosen), [sorted, chosen]);
  if (!range) return null;

  // the list decides alone: the slider goes off and the chosen maps are switched on, the rest off
  const show = (picked: readonly OwnMap[]) => {
    const ids = new Set(picked.map((m) => m.id));
    setTimeYear(null);
    setYears(null);
    for (const m of maps)
      if (m.visible !== ids.has(m.id)) void update(m.id, { visible: ids.has(m.id) });
  };

  const goTo = (year: number) => {
    const pick = timeSelection(year, maps, HISTORICAL_LAYERS);
    setTimeYear(year);
    setYears(pick.years);
    const layers = useLayersStore.getState();
    layers.setHistoricalId(pick.layerId);
    if (pick.layerYear !== null) layers.setHistoricalYear(pick.layerYear);
  };
  const shown = timeYear === null ? null : timeSelection(timeYear, maps, HISTORICAL_LAYERS).shown;

  return (
    <Stack data-tour="maps-year" spacing={0.5}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" sx={{ flex: 1 }}>
          Rok: <b>{timeYear ?? 'wybierz suwakiem'}</b>
        </Typography>
        {timeYear !== null && (
          <Chip
            size="small"
            label="Wyłącz"
            onClick={() => {
              setTimeYear(null);
              setYears(null);
            }}
          />
        )}
      </Stack>
      <Slider
        size="small"
        min={range.min}
        max={range.max}
        step={1}
        value={timeYear ?? range.min}
        marks={ownYears.map((y) => ({ value: y, label: String(y) }))}
        valueLabelDisplay="auto"
        onChange={(_, v) => goTo(v as number)}
        aria-label="Rok mapy"
        // room for the year labels of your maps under the track
        sx={{ mx: 1, mb: ownYears.length ? 2.5 : 0, width: 'auto' }}
      />
      {shown && (
        <Typography variant="caption" color="text.secondary">
          {shown.length ? `Widać: ${shown.join(', ')}` : 'Z tego roku nie ma żadnej mapy'}
        </Typography>
      )}
      {maps.length > 0 && (
        <Autocomplete
          multiple
          size="small"
          disableCloseOnSelect
          options={sorted}
          value={shownList}
          groupBy={(m) => (m.year ? String(m.year) : 'Bez roku')}
          getOptionLabel={(m) => m.name}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          // typing finds a map by its name or its year
          filterOptions={(options, { inputValue }) => {
            const q = inputValue.trim().toLowerCase();
            return q
              ? options.filter((m) => `${m.name} ${m.year ?? ''}`.toLowerCase().includes(q))
              : options;
          }}
          renderGroup={(group) => (
            <li key={group.key}>
              <ListSubheader
                sx={{ cursor: 'pointer', lineHeight: '36px' }}
                // keep the list open: a click on the year shows all its maps
                onMouseDown={(e) => e.preventDefault()}
                onClick={() =>
                  show([
                    ...shownList,
                    ...sorted.filter((m) => (m.year ? String(m.year) : 'Bez roku') === group.group),
                  ])
                }
              >
                {group.group}: pokaż wszystkie
              </ListSubheader>
              <ul style={{ padding: 0 }}>{group.children}</ul>
            </li>
          )}
          renderOption={({ key, ...props }, m) => (
            <li key={key} {...props}>
              <Stack>
                <Typography variant="body2">{m.name}</Typography>
                {m.shared && !m.shared.mine && (
                  <Typography variant="caption" color="text.secondary">
                    od: {m.shared.author ?? 'członka społeczności'}
                  </Typography>
                )}
              </Stack>
            </li>
          )}
          onChange={(_, v) => show(v)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Pokazane mapy"
              placeholder={shownList.length ? '' : 'Wpisz nazwę albo rok'}
            />
          )}
          sx={{ pt: 0.5 }}
        />
      )}
    </Stack>
  );
}
