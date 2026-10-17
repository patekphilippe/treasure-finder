import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { formatDate } from '@/shared/lib/format';
import type { Zone } from '@/shared/types/domain';
import { useMountTime } from '@/shared/hooks/useMountTime';
import { Icon } from '@/shared/ui';
import { ZONE_STYLE } from '../config/zoneStyle';
import { isPermitValid } from '../utils/isPermitValid';

interface ZoneListItemProps {
  zone: Zone;
  onClick: () => void;
}

export function ZoneListItem({ zone, onClick }: ZoneListItemProps) {
  const now = useMountTime();
  const style = ZONE_STYLE[zone.kind];
  const expired = zone.kind === 'zgoda' && !isPermitValid(zone, now);
  let info: string;
  if (zone.kind === 'zakaz') info = 'Nie wolno tu szukać';
  else if (expired) info = `Zgoda wygasła ${formatDate(zone.validUntil!)}`;
  else
    info =
      [
        zone.permitNo && `nr ${zone.permitNo}`,
        zone.validUntil && `do ${formatDate(zone.validUntil)}`,
      ]
        .filter(Boolean)
        .join(' · ') || 'Uzupełnij numer zgłoszenia i termin';

  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        width: '100%',
        justifyContent: 'flex-start',
        textAlign: 'left',
        gap: 1.5,
        py: 1,
        px: 1,
        mx: -1,
        borderRadius: '10px',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          flexShrink: 0,
          borderRadius: '10px',
          display: 'grid',
          placeItems: 'center',
          color: style.color,
          bgcolor: alpha(style.color, 0.14),
        }}
      >
        <Icon name={style.icon} size={20} />
      </Box>
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap>
          {zone.name}
        </Typography>
        <Typography variant="caption" color={expired ? 'error.main' : 'text.secondary'} noWrap>
          {info}
        </Typography>
      </Stack>
    </ButtonBase>
  );
}
