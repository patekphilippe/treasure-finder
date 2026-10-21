import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { HISTORICAL_ONLINE_NOTE } from '@/features/safety';
import { Icon } from '@/shared/ui';
import { HISTORICAL_LAYERS } from '../config/historicalLayers';
import { useLayersStore } from '../store/useLayersStore';
import { findHistoricalLayer } from '../utils/findHistoricalLayer';

const NONE = 'brak';

interface HistoricalSectionProps {
  /** the time slider over all historical maps, owned by history (composed in the app shell) */
  timeline?: ReactNode;
  /** which own maps are shown, owned by history */
  ownMaps?: ReactNode;
  /** archival objects, owned by history */
  children?: ReactNode;
}

/**
 * Warstwy: old maps, laid out for a phone: the year, your maps, the online map, one opacity for
 * all of them, then (from history) the objects read from maps.
 */
export function HistoricalSection({ timeline, ownMaps, children }: HistoricalSectionProps) {
  const historicalId = useLayersStore((s) => s.historicalId);
  const opacity = useLayersStore((s) => s.historicalOpacity);
  const year = useLayersStore((s) => s.historicalYear);
  const setHistoricalId = useLayersStore((s) => s.setHistoricalId);
  const setOpacity = useLayersStore((s) => s.setHistoricalOpacity);
  const setYear = useLayersStore((s) => s.setHistoricalYear);
  const layer = findHistoricalLayer(historicalId);

  return (
    <Stack data-tour="layers-historical" spacing={1.5}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Icon name="history" size={22} />
        <Stack sx={{ flex: 1 }}>
          <Typography variant="subtitle2">Stare mapy</Typography>
          <Typography variant="caption" color="text.secondary">
            Twoje skany i mapy z internetu
          </Typography>
        </Stack>
      </Stack>
      {timeline}
      {ownMaps}
      <Stack spacing={0.75}>
        <TextField
          select
          fullWidth
          size="small"
          label="Mapa z internetu"
          value={layer?.id ?? NONE}
          onChange={(e) => setHistoricalId(e.target.value === NONE ? null : e.target.value)}
          slotProps={{
            select: {
              // one line in the field; years and area are in the list and under it
              renderValue: (id) => findHistoricalLayer(id as string)?.label ?? 'Wyłączona',
            },
          }}
        >
          <MenuItem value={NONE}>Wyłączona</MenuItem>
          {HISTORICAL_LAYERS.map((l) => (
            <MenuItem key={l.id} value={l.id} sx={{ whiteSpace: 'normal' }}>
              <Stack>
                <Typography variant="body2">{l.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {l.years}, {l.coverage}
                </Typography>
              </Stack>
            </MenuItem>
          ))}
        </TextField>
        {layer?.yearRange && (
          <Stack direction="row" sx={{ alignItems: 'center', gap: 2, px: 0.5 }}>
            <Typography variant="body2" sx={{ minWidth: 92 }}>
              Zdjęcia z {year}
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
        <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>
          {layer && `${layer.years}, ${layer.coverage}. `}
          {layer?.minZoom ? 'Widać po przybliżeniu mapy. ' : ''}
          {HISTORICAL_ONLINE_NOTE}{' '}
          {layer && (
            <Link href={layer.termsUrl} target="_blank" rel="noreferrer">
              Źródło i warunki
            </Link>
          )}
        </Typography>
      </Stack>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 2, px: 0.5 }}>
        <Typography variant="body2" sx={{ minWidth: 52 }}>
          Krycie
        </Typography>
        <Slider
          size="small"
          min={0.1}
          max={1}
          step={0.05}
          value={opacity}
          onChange={(_, v) => setOpacity(v as number)}
          aria-label="Krycie starych map"
        />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ minWidth: 34, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
        >
          {Math.round(opacity * 100)}%
        </Typography>
      </Stack>
      {children}
    </Stack>
  );
}
