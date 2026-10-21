import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';
import { HISTORICAL_LAYERS, useLayersStore } from '@/features/layers';
import { Icon } from '@/shared/ui';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { timeSelection } from '../utils/timeSelection';
import { yearStops } from '../utils/yearStops';

/**
 * Warstwy: the time slider over all historical maps, in its own tile. A year shows your maps of
 * that year and the online map covering it (an orthophoto of that year, a Messtischblatt
 * edition…); the objects read from maps of that year stand out. The slider stops only at years
 * with a map, the arrows step from one to the next; "Wyłącz suwak" goes back to the choice below.
 */
export function MapTimeSlider() {
  const maps = useOwnMapsStore((s) => s.maps);
  const timeYear = useOwnMapsStore((s) => s.timeYear);
  const setYears = useOwnMapsStore((s) => s.setYears);
  const setTimeYear = useOwnMapsStore((s) => s.setTimeYear);
  const { stops, labelled } = useMemo(() => yearStops(maps, HISTORICAL_LAYERS), [maps]);
  if (!stops.length) return null;
  const min = stops[0]!;
  const max = stops[stops.length - 1]!;

  const goTo = (year: number) => {
    const pick = timeSelection(year, maps, HISTORICAL_LAYERS);
    setTimeYear(year);
    setYears(pick.years);
    const layers = useLayersStore.getState();
    layers.setHistoricalId(pick.layerId);
    if (pick.layerYear !== null) layers.setHistoricalYear(pick.layerYear);
  };
  // from no year the right arrow starts at the oldest map, the left one at the newest
  const step = (dir: 1 | -1) => {
    const next =
      timeYear === null
        ? dir > 0
          ? min
          : max
        : dir > 0
          ? stops.find((y) => y > timeYear)
          : stops.findLast((y) => y < timeYear);
    if (next !== undefined) goTo(next);
  };
  const shown = timeYear === null ? null : timeSelection(timeYear, maps, HISTORICAL_LAYERS).shown;
  const marks = stops.map((y) => ({
    value: y,
    ...(labelled.includes(y) && { label: String(y) }),
  }));

  return (
    <Stack
      data-tour="maps-year"
      sx={{ bgcolor: 'action.hover', borderRadius: '12px', px: 1, pt: 1, pb: 0.5 }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
        <IconButton
          aria-label="Wcześniejszy rok"
          disabled={timeYear !== null && timeYear <= min}
          onClick={() => step(-1)}
        >
          <Icon name="angle-left" size={22} />
        </IconButton>
        <Stack sx={{ flex: 1, minWidth: 0, alignItems: 'center', textAlign: 'center' }}>
          <Typography variant="h6" sx={{ lineHeight: 1.25, fontVariantNumeric: 'tabular-nums' }}>
            {timeYear ?? 'Wybierz rok'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
            {shown === null
              ? 'Mapy z jednego roku: przesuń suwak albo użyj strzałek'
              : shown.length
                ? shown.join(', ')
                : 'Z tego roku nie ma żadnej mapy'}
          </Typography>
        </Stack>
        <IconButton
          aria-label="Późniejszy rok"
          disabled={timeYear !== null && timeYear >= max}
          onClick={() => step(1)}
        >
          <Icon name="angle-right" size={22} />
        </IconButton>
      </Stack>
      <Slider
        min={min}
        max={max}
        step={null}
        marks={marks}
        track={false}
        value={timeYear ?? min}
        valueLabelDisplay="auto"
        onChange={(_, v) => goTo(v as number)}
        aria-label="Rok mapy"
        sx={{
          width: 'auto',
          mx: 2,
          mt: 0.5,
          mb: 2.5,
          // no year yet: no thumb pretending the oldest one is chosen
          ...(timeYear === null && { '& .MuiSlider-thumb': { opacity: 0 } }),
          '& .MuiSlider-mark': { width: 4, height: 4, borderRadius: '50%' },
          '& .MuiSlider-markLabel': { fontSize: 11, top: 30, color: 'text.secondary' },
          // the end labels stay inside the tile
          '& .MuiSlider-markLabel[data-index="0"]': { transform: 'translateX(-20%)' },
          [`& .MuiSlider-markLabel[data-index="${marks.length - 1}"]`]: {
            transform: 'translateX(-80%)',
          },
        }}
      />
      {timeYear !== null && (
        <Button
          size="small"
          color="inherit"
          startIcon={<Icon name="times" size={16} />}
          onClick={() => {
            setTimeYear(null);
            setYears(null);
          }}
          sx={{ alignSelf: 'center', mb: 0.5 }}
        >
          Wyłącz suwak
        </Button>
      )}
    </Stack>
  );
}
