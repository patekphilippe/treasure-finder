import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import type { CustomLayer } from '@/shared/types/domain';
import { Icon } from '@/shared/ui';

interface CustomLayerItemProps {
  layer: CustomLayer;
  onChange: (patch: Partial<CustomLayer>) => void;
  onDelete: () => void;
}

export function CustomLayerItem({ layer, onChange, onDelete }: CustomLayerItemProps) {
  return (
    <Stack sx={{ py: 1, borderTop: 1, borderColor: 'divider' }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
        <Chip
          size="small"
          label={layer.kind.toUpperCase()}
          sx={{ borderRadius: '6px', height: 22, fontSize: 11 }}
        />
        <Typography variant="subtitle2" noWrap sx={{ flex: 1, minWidth: 0 }}>
          {layer.name}
        </Typography>
        <IconButton size="small" aria-label={`Usuń ${layer.name}`} onClick={onDelete}>
          <Icon name="trash-alt" size={18} />
        </IconButton>
        <Switch checked={layer.on} onChange={(e) => onChange({ on: e.target.checked })} />
      </Stack>
      {layer.on && (
        <Stack direction="row" sx={{ alignItems: 'center', gap: 2, pl: 1, pr: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40 }}>
            Krycie
          </Typography>
          <Slider
            size="small"
            min={0.1}
            max={1}
            step={0.05}
            value={layer.opacity}
            onChange={(_, value) => onChange({ opacity: value as number })}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${Math.round(v * 100)}%`}
          />
        </Stack>
      )}
    </Stack>
  );
}
