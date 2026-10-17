import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import type { PointType } from '@/shared/types/domain';
import { Icon } from '@/shared/ui';
import { POINT_TYPE_ORDER, POINT_TYPES } from '../config/pointTypes';

interface PointTypePickerProps {
  value: PointType;
  onChange: (type: PointType) => void;
}

export function PointTypePicker({ value, onChange }: PointTypePickerProps) {
  return (
    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }} role="radiogroup" aria-label="Rodzaj">
      {POINT_TYPE_ORDER.map((type) => {
        const meta = POINT_TYPES[type];
        const selected = type === value;
        return (
          <Chip
            key={type}
            role="radio"
            aria-checked={selected}
            label={meta.label}
            icon={<Icon name={meta.icon} size={16} />}
            onClick={() => onChange(type)}
            variant={selected ? 'filled' : 'outlined'}
            sx={{
              borderRadius: '10px',
              height: 34,
              '& .MuiChip-icon': { color: meta.color },
              ...(selected && {
                bgcolor: alpha(meta.color, 0.16),
                color: 'text.primary',
                boxShadow: `inset 0 0 0 1.5px ${meta.color}`,
                '&:hover': { bgcolor: alpha(meta.color, 0.22) },
              }),
            }}
          />
        );
      })}
    </Stack>
  );
}
