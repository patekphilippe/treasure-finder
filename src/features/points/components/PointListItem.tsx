import ButtonBase from '@mui/material/ButtonBase';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { formatDate, formatDistance } from '@/shared/lib/format';
import type { FieldPoint } from '@/shared/types/domain';
import { Icon } from '@/shared/ui';
import { POINT_STATUS_LABELS, POINT_TYPES } from '../config/pointTypes';

interface PointListItemProps {
  point: FieldPoint;
  distM: number | null;
  onClick: () => void;
}

export function PointListItem({ point, distM, onClick }: PointListItemProps) {
  const meta = POINT_TYPES[point.type];

  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        width: '100%',
        justifyContent: 'flex-start',
        textAlign: 'left',
        gap: 1.5,
        py: 1.25,
        px: 1,
        mx: -1,
        borderRadius: '10px',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: '10px',
          display: 'grid',
          placeItems: 'center',
          color: meta.color,
          bgcolor: alpha(meta.color, 0.14),
        }}
      >
        <Icon name={meta.icon} size={22} />
      </Box>
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap>
          {point.name}
          {point.flags?.uxo && (
            <Icon
              name="exclamation-triangle"
              size={15}
              sx={{ color: 'error.main', ml: 0.5, verticalAlign: '-2px' }}
            />
          )}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {POINT_STATUS_LABELS[point.status]} · {formatDate(point.created)}
        </Typography>
      </Stack>
      {distM !== null && (
        <Typography variant="subtitle2" color="text.secondary" sx={{ flexShrink: 0 }}>
          {formatDistance(distM)}
        </Typography>
      )}
    </ButtonBase>
  );
}
