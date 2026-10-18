import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { HISTORICAL_ONLINE_NOTE } from '@/features/safety';
import { useUiStore } from '@/shared/store/useUiStore';
import { Icon } from '@/shared/ui';
import { HISTORICAL_LAYERS } from '../config/historicalLayers';
import { useLayersStore } from '../store/useLayersStore';
import { findHistoricalLayer } from '../utils/findHistoricalLayer';

const NONE = 'brak';

export function HistoricalSection() {
  const historicalId = useLayersStore((s) => s.historicalId);
  const opacity = useLayersStore((s) => s.historicalOpacity);
  const year = useLayersStore((s) => s.historicalYear);
  const setHistoricalId = useLayersStore((s) => s.setHistoricalId);
  const setOpacity = useLayersStore((s) => s.setHistoricalOpacity);
  const setYear = useLayersStore((s) => s.setHistoricalYear);
  const layer = findHistoricalLayer(historicalId);
  const showSheet = useUiStore((s) => s.showSheet);

  return (
    <Stack data-tour="layers-historical" spacing={1}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Icon name="history" size={22} />
        <Stack sx={{ flex: 1 }}>
          <Typography variant="subtitle2">Mapa historyczna</Typography>
          <Typography variant="caption" color="text.secondary">
            {HISTORICAL_ONLINE_NOTE}
          </Typography>
        </Stack>
      </Stack>
      <TextField
        select
        size="small"
        label="Mapa"
        value={layer?.id ?? NONE}
        onChange={(e) => setHistoricalId(e.target.value === NONE ? null : e.target.value)}
      >
        <MenuItem value={NONE}>Wyłączona</MenuItem>
        {HISTORICAL_LAYERS.map((l) => (
          <MenuItem key={l.id} value={l.id}>
            <Stack>
              <Typography variant="body2">{l.label}</Typography>
              <Typography variant="caption" color="text.secondary">
                {l.years}, {l.coverage.toLowerCase()}
              </Typography>
            </Stack>
          </MenuItem>
        ))}
      </TextField>
      {layer && (
        <>
          {layer.yearRange && (
            <Stack direction="row" sx={{ alignItems: 'center', gap: 2, pl: 4.5, pr: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40 }}>
                Rok {year}
              </Typography>
              <Slider
                size="small"
                min={layer.yearRange.min}
                max={layer.yearRange.max}
                step={1}
                value={year}
                onChange={(_, v) => setYear(v as number)}
                aria-label="Rok zdjęć"
              />
            </Stack>
          )}
          <Stack direction="row" sx={{ alignItems: 'center', gap: 2, pl: 4.5, pr: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40 }}>
              Krycie
            </Typography>
            <Slider
              size="small"
              min={0.1}
              max={1}
              step={0.05}
              value={opacity}
              onChange={(_, v) => setOpacity(v as number)}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => `${Math.round(v * 100)}%`}
            />
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ pl: 4.5 }}>
            {layer.coverage}.{' '}
            {layer.minZoom && 'Widać po przybliżeniu mapy. '}
            <Link href={layer.termsUrl} target="_blank" rel="noreferrer">
              Źródło i warunki
            </Link>
          </Typography>
        </>
      )}
      <Button
        size="small"
        startIcon={<Icon name="map-marked-alt" size={16} />}
        onClick={() => showSheet('history')}
        sx={{ alignSelf: 'flex-start' }}
      >
        Obiekty z map archiwalnych
      </Button>
    </Stack>
  );
}
