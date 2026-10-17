import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { RoughArea } from '@/shared/types/domain';
import { AREA_CATEGORIES } from '../config/areaCategories';
import { describeShape } from '../utils/describeShape';

interface AreaListItemProps {
  area: RoughArea;
  onClick: () => void;
}

export function AreaListItem({ area, onClick }: AreaListItemProps) {
  const meta = AREA_CATEGORIES[area.category];
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        justifyContent: 'flex-start',
        textAlign: 'left',
        gap: 1.25,
        py: 0.75,
        px: 1,
        mx: -1,
        borderRadius: '8px',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Box
        sx={{
          width: 26,
          height: 26,
          flexShrink: 0,
          borderRadius: '50%',
          bgcolor: meta.color,
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          fontSize: 12,
          fontWeight: 700,
          opacity: area.category === 'nieistotne' ? 0.5 : 1,
        }}
      >
        {area.no}
      </Box>
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
          {meta.label}
          {area.auto && (
            <Typography component="span" variant="caption" color="text.secondary">
              {' '}
              (auto)
            </Typography>
          )}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {describeShape(area)}
        </Typography>
      </Stack>
    </ButtonBase>
  );
}
