import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { OwnMap } from '@/shared/types/domain';
import { Icon } from '@/shared/ui';
import { METHOD_LABEL } from '../config/ownMaps';
import { parseMapYear } from '../utils/parseMapYear';

interface OwnMapItemProps {
  map: OwnMap;
  onChange: (patch: Partial<OwnMap>) => void;
  onShow: () => void;
  onFit: () => void;
  onDelete: () => void;
}

export function OwnMapItem({ map, onChange, onShow, onFit, onDelete }: OwnMapItemProps) {
  return (
    <Stack spacing={0.25} sx={{ py: 0.5 }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
        <Icon name="map" size={20} />
        <Stack sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>
            {map.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {METHOD_LABEL[map.method]}, {map.width} × {map.height} px
          </Typography>
        </Stack>
        <IconButton size="small" aria-label="Włącz i pokaż na mapie" onClick={onShow}>
          <Icon name="crosshairs" size={18} />
        </IconButton>
        <IconButton size="small" aria-label="Dopasuj narożnikami" onClick={onFit}>
          <Icon name="vector-square" size={18} />
        </IconButton>
        <IconButton size="small" aria-label="Usuń mapę" color="error" onClick={onDelete}>
          <Icon name="trash" size={18} />
        </IconButton>
      </Stack>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 2, pl: 3.5, pr: 1 }}>
        <TextField
          key={map.year ?? ''}
          size="small"
          label="Rok mapy"
          placeholder="np. 1936"
          defaultValue={map.year ?? ''}
          slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 4 } }}
          sx={{ width: 120 }}
          onBlur={(e) => {
            const year = parseMapYear(e.target.value);
            if (year === null) e.target.value = map.year ? String(map.year) : '';
            else if (year !== map.year) onChange({ year });
          }}
        />
        <Typography variant="caption" color="text.secondary">
          Obiekty oznaczone na tej mapie dostaną ten rok.
        </Typography>
      </Stack>
    </Stack>
  );
}
