import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useUiStore } from '@/shared/store/useUiStore';
import { Icon } from '@/shared/ui';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { MapYearSlider } from './MapYearSlider';
import { OwnMapLayerItem } from './OwnMapLayerItem';

/** Warstwy: which own maps are shown; they are loaded and managed in Dane. */
export function OwnMapsVisibility() {
  const maps = useOwnMapsStore((s) => s.maps);
  const update = useOwnMapsStore((s) => s.update);
  const showSheet = useUiStore((s) => s.showSheet);

  return (
    <Stack data-tour="layers-own-maps" spacing={0.75} sx={{ pl: 4.5 }}>
      <Typography variant="overline" color="text.secondary">
        Własne mapy ({maps.length})
      </Typography>
      <MapYearSlider />
      {maps.map((m) => (
        <OwnMapLayerItem key={m.id} map={m} onChange={(patch) => void update(m.id, patch)} />
      ))}
      <Button
        size="small"
        color="inherit"
        startIcon={<Icon name="exchange-alt" size={16} />}
        onClick={() => showSheet('data')}
        sx={{ alignSelf: 'flex-start' }}
      >
        {maps.length ? 'Wczytaj albo dopasuj w Danych' : 'Skan albo GeoTIFF wczytasz w Danych'}
      </Button>
    </Stack>
  );
}
