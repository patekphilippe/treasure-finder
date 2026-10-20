import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { findHistoricalLayer } from '@/features/layers';
import type { Sighting } from '@/shared/types/domain';
import { Icon, useToastStore } from '@/shared/ui';
import { showSourceMap } from '../services/showSourceMap';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { describeSighting } from '../utils/describeSighting';

interface SightingRowProps {
  sighting: Sighting;
  /** where the object is, to fly there with the map */
  at: { lat: number; lng: number } | null;
}

/** One map an archival object was seen on, with a button that shows that map. */
export function SightingRow({ sighting, at }: SightingRowProps) {
  const { map } = sighting;
  const ownId = map.kind === 'own' ? map.id : null;
  const ownExists = useOwnMapsStore((s) => s.maps.some((m) => m.id === ownId));
  const showToast = useToastStore((s) => s.show);
  const { title, detail } = describeSighting(sighting);
  const canShow =
    map.kind === 'own' ? ownExists : map.kind === 'wms' && !!findHistoricalLayer(map.id);

  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
      <Icon name={map.kind === 'none' ? 'book' : 'map'} size={18} />
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2">{title}</Typography>
        <Typography variant="caption" color="text.secondary">
          {map.kind === 'own' && !ownExists ? `${detail}, mapa usunięta` : detail}
        </Typography>
      </Stack>
      {canShow && (
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          onClick={() =>
            void showSourceMap(map, at).then((ok) =>
              showToast(ok ? `Pokazano mapę: ${map.label}` : 'Tej mapy już nie ma'),
            )
          }
        >
          Pokaż mapę
        </Button>
      )}
    </Stack>
  );
}
