import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { countTiles, formatDate, formatMegabytes } from '@/shared/lib/format';
import { Icon } from '@/shared/ui';
import type { OfflineArea } from '../types';

interface OfflineAreaItemProps {
  area: OfflineArea;
  onShow: () => void;
  onDelete: () => void;
}

export function OfflineAreaItem({ area, onShow, onDelete }: OfflineAreaItemProps) {
  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 1, py: 0.75 }}>
      <Icon name="map" size={22} />
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap>
          {area.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatDate(Date.parse(area.created))} · {formatMegabytes(area.bytes)} ·{' '}
          {area.layers.join(', ')}
        </Typography>
        {area.failed > 0 && (
          <Typography variant="caption" color="warning.main">
            Brakuje: {countTiles(area.failed)}. Pobierz obszar ponownie przy lepszym zasięgu.
          </Typography>
        )}
      </Stack>
      <IconButton size="small" aria-label="Pokaż na mapie" onClick={onShow}>
        <Icon name="crosshairs" size={20} />
      </IconButton>
      <IconButton size="small" aria-label="Usuń obszar" color="error" onClick={onDelete}>
        <Icon name="trash" size={20} />
      </IconButton>
    </Stack>
  );
}
