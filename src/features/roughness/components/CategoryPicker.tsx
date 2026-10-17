import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import type { AreaCategory } from '@/shared/types/domain';
import { Icon } from '@/shared/ui';
import { AREA_CATEGORIES, AREA_CATEGORY_ORDER } from '../config/areaCategories';

interface CategoryPickerProps {
  value: AreaCategory;
  onChange: (category: AreaCategory) => void;
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  return (
    <Stack
      direction="row"
      sx={{ flexWrap: 'wrap', gap: 0.75 }}
      role="radiogroup"
      aria-label="Kategoria miejsca"
    >
      {AREA_CATEGORY_ORDER.map((cat) => {
        const meta = AREA_CATEGORIES[cat];
        const selected = cat === value;
        return (
          <Chip
            key={cat}
            role="radio"
            aria-checked={selected}
            label={meta.label}
            icon={<Icon name={meta.icon} size={16} />}
            onClick={() => onChange(cat)}
            variant={selected ? 'filled' : 'outlined'}
            sx={{
              borderRadius: '10px',
              height: 32,
              '& .MuiChip-icon': { color: meta.color },
              ...(selected && {
                bgcolor: alpha(meta.color, 0.16),
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
