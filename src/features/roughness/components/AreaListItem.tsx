import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { RoughArea } from '@/shared/types/domain';
import { PLACE_COLOR } from '../config/places';
import { describeShape } from '../utils/describeShape';

interface AreaListItemProps {
  area: RoughArea;
  onClick: () => void;
}

export function AreaListItem({ area, onClick }: AreaListItemProps) {
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
          bgcolor: PLACE_COLOR,
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {area.no}
      </Box>
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
          Obszar do sprawdzenia
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {describeShape(area)}
        </Typography>
      </Stack>
    </ButtonBase>
  );
}
