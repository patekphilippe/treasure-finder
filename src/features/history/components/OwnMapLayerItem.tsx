import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import type { OwnMap } from '@/shared/types/domain';

interface OwnMapLayerItemProps {
  map: OwnMap;
  onChange: (patch: Partial<OwnMap>) => void;
}

/** An own map in Warstwy: shown or not (the opacity is common to all old maps). */
export function OwnMapLayerItem({ map, onChange }: OwnMapLayerItemProps) {
  return (
    <Stack spacing={0.25}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
          {map.name}
          {map.year ? ` (${map.year})` : ''}
        </Typography>
        <Switch
          size="small"
          checked={map.visible}
          onChange={(e) => onChange({ visible: e.target.checked })}
          slotProps={{ input: { 'aria-label': `Pokaż: ${map.name}` } }}
        />
      </Stack>
    </Stack>
  );
}
