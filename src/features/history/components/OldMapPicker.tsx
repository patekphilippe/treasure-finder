import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';
import { HISTORICAL_LAYERS, useLayersStore } from '@/features/layers';
import { HISTORICAL_ONLINE_NOTE } from '@/features/safety';
import { useUiStore } from '@/shared/store/useUiStore';
import { Icon } from '@/shared/ui';
import { chooseOldMap } from '../services/chooseOldMap';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { oldMapGroups } from '../utils/oldMapGroups';
import { oldMapGroupText } from '../utils/oldMapGroupText';
import { pickedOldMap } from '../utils/pickedOldMap';
import { OldMapOption } from './OldMapOption';

/**
 * Warstwy: which old map lies on top, one tap on one tile: none, your maps of one year, or one
 * map from the internet. Under the list: how strongly the old map shows, then adding your own.
 */
export function OldMapPicker() {
  const maps = useOwnMapsStore((s) => s.maps);
  const historicalId = useLayersStore((s) => s.historicalId);
  const year = useLayersStore((s) => s.historicalYear);
  const setYear = useLayersStore((s) => s.setHistoricalYear);
  const opacity = useLayersStore((s) => s.historicalOpacity);
  const setOpacity = useLayersStore((s) => s.setHistoricalOpacity);
  const showSheet = useUiStore((s) => s.showSheet);
  const groups = useMemo(() => oldMapGroups(maps), [maps]);
  const picked = pickedOldMap(maps, historicalId);

  return (
    <Stack data-tour="layers-historical" spacing={1} role="radiogroup" aria-label="Stara mapa">
      <Stack>
        <Typography variant="overline" color="text.secondary">
          Stara mapa
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Dotknij jednej, a położy się na mapie.
        </Typography>
      </Stack>
      <OldMapOption
        selected={picked.none}
        title="Bez starej mapy"
        subtitle="Tylko dzisiejsza mapa"
        onClick={() => void chooseOldMap({ kind: 'none' })}
      />
      {groups.map((g) => (
        <OldMapOption
          key={g.key}
          selected={picked.ownKey === g.key}
          {...oldMapGroupText(g)}
          onClick={() => void chooseOldMap({ kind: 'own', key: g.key })}
        />
      ))}
      {HISTORICAL_LAYERS.map((l) => (
        <OldMapOption
          key={l.id}
          selected={picked.onlineId === l.id}
          title={l.plain.title}
          subtitle={l.plain.about}
          onClick={() => void chooseOldMap({ kind: 'online', id: l.id })}
        >
          {l.yearRange && (
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
              <IconButton
                aria-label="Rok wcześniej"
                disabled={year <= l.yearRange.min}
                onClick={() => setYear(year - 1)}
              >
                <Icon name="angle-left" size={20} />
              </IconButton>
              <Typography
                variant="subtitle2"
                sx={{ flex: 1, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}
              >
                Zdjęcia z {year} r.
              </Typography>
              <IconButton
                aria-label="Rok później"
                disabled={year >= l.yearRange.max}
                onClick={() => setYear(year + 1)}
              >
                <Icon name="angle-right" size={20} />
              </IconButton>
            </Stack>
          )}
          <Typography variant="caption" color="text.secondary">
            {l.minZoom ? 'Widać dopiero po przybliżeniu mapy. ' : ''}
            {HISTORICAL_ONLINE_NOTE}{' '}
            <Link href={l.termsUrl} target="_blank" rel="noreferrer">
              Źródło i warunki
            </Link>
          </Typography>
        </OldMapOption>
      ))}
      {!picked.none && (
        <Stack spacing={0.25} sx={{ pt: 0.5 }}>
          <Typography variant="subtitle2">Jak mocno widać starą mapę</Typography>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}>
            <Typography variant="caption" color="text.secondary">
              słabo
            </Typography>
            <Slider
              min={0.1}
              max={1}
              step={0.05}
              value={opacity}
              onChange={(_, v) => setOpacity(v as number)}
              aria-label="Jak mocno widać starą mapę"
            />
            <Typography variant="caption" color="text.secondary">
              mocno
            </Typography>
          </Stack>
        </Stack>
      )}
      <Stack direction="row" sx={{ gap: 1, pt: 1 }}>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<Icon name="plus" size={18} />}
          onClick={() => showSheet('ownMaps')}
          sx={{ flex: 1 }}
        >
          Dodaj swoją mapę
        </Button>
        {maps.length > 0 && (
          <Button color="inherit" onClick={() => showSheet('ownMaps')}>
            Popraw lub usuń
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
