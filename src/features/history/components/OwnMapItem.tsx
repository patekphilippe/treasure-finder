import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import type { OwnMap } from '@/shared/types/domain';
import { Icon } from '@/shared/ui';
import { METHOD_LABEL } from '../config/ownMaps';

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
        <Switch
          size="small"
          checked={map.visible}
          onChange={(e) => onChange({ visible: e.target.checked })}
        />
        <Stack sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>
            {map.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {METHOD_LABEL[map.method]}, {map.width} × {map.height} px
          </Typography>
        </Stack>
        <IconButton size="small" aria-label="Pokaż na mapie" onClick={onShow}>
          <Icon name="crosshairs" size={18} />
        </IconButton>
        <IconButton size="small" aria-label="Dopasuj narożnikami" onClick={onFit}>
          <Icon name="vector-square" size={18} />
        </IconButton>
        <IconButton size="small" aria-label="Usuń mapę" color="error" onClick={onDelete}>
          <Icon name="trash" size={18} />
        </IconButton>
      </Stack>
      {map.visible && (
        <Stack direction="row" sx={{ alignItems: 'center', gap: 2, pl: 6, pr: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40 }}>
            Krycie
          </Typography>
          <Slider
            size="small"
            min={0.1}
            max={1}
            step={0.05}
            value={map.opacity}
            onChange={(_, v) => onChange({ opacity: v as number })}
            aria-label={`Krycie: ${map.name}`}
          />
        </Stack>
      )}
    </Stack>
  );
}
