import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { findHistoricalLayer } from '@/features/layers';
import type { Sighting } from '@/shared/types/domain';
import { Icon, useToastStore } from '@/shared/ui';
import { showSourceMap } from '../services/showSourceMap';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { describeSighting } from '../utils/describeSighting';
import { readableMapName } from '../utils/readableMapName';

interface SightingRowProps {
  sighting: Sighting;
  /** where the object is, to fly there with the map */
  at: { lat: number; lng: number } | null;
}

/** One map an archival object was seen on, in a tile, with a button that shows that map. */
export function SightingRow({ sighting, at }: SightingRowProps) {
  const { map } = sighting;
  const ownId = map.kind === 'own' ? map.id : null;
  const ownExists = useOwnMapsStore((s) => s.maps.some((m) => m.id === ownId));
  const showToast = useToastStore((s) => s.show);
  const { title, detail } = describeSighting(sighting);
  const canShow =
    map.kind === 'own' ? ownExists : map.kind === 'wms' && !!findHistoricalLayer(map.id);

  return (
    <Stack sx={{ bgcolor: 'action.hover', borderRadius: '12px', p: 1.5 }}>
      <Stack direction="row" sx={{ alignItems: 'flex-start', gap: 1.25 }}>
        <Stack sx={{ pt: 0.25 }}>
          <Icon name={map.kind === 'none' ? 'book' : 'map'} size={18} />
        </Stack>
        <Stack sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            // a long file name wraps (at most three lines) instead of running off the sheet
            sx={{
              overflowWrap: 'anywhere',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {readableMapName(title)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {map.kind === 'own' && !ownExists ? `${detail}, mapa usunięta` : detail}
          </Typography>
          {canShow && (
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={<Icon name="layer-group" size={16} />}
              sx={{ alignSelf: 'flex-start', mt: 1 }}
              onClick={() =>
                void showSourceMap(map, at).then((ok) =>
                  showToast(
                    ok ? `Pokazano mapę: ${readableMapName(map.label)}` : 'Tej mapy już nie ma',
                  ),
                )
              }
            >
              Pokaż mapę
            </Button>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
}
