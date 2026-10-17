import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { formatDistance } from '@/shared/lib/format';
import { useZoneAlertStore } from '@/features/zones';
import { useFieldStore } from '@/shared/store/useFieldStore';
import { glass, Icon } from '@/shared/ui';
import { useGuidance } from '../hooks/useGuidance';

/** Floating card with an arrow to the target point and the remaining distance. */
export function GuidancePanel() {
  const guidance = useGuidance();
  const setTarget = useFieldStore((s) => s.setNavigationTarget);
  const alertShown = useZoneAlertStore((s) => s.alert !== null);
  if (!guidance) return null;

  const { target, distM, relative, bearing, arrived } = guidance;
  const angle = relative ?? bearing;
  let hint: string;
  if (distM === null) hint = 'Czekam na sygnał GPS…';
  else if (arrived) hint = 'Jesteś na miejscu';
  else if (relative === null) hint = 'Kierunek względem północy';
  else hint = 'Idź w kierunku strzałki';

  return (
    <Paper
      sx={(theme) => ({
        ...glass(theme),
        position: 'absolute',
        zIndex: 1100,
        left: '50%',
        transform: 'translateX(-50%)',
        top: `calc(env(safe-area-inset-top, 0px) + ${alertShown ? 172 : 104}px)`,
        width: 'min(calc(100% - 24px), 440px)',
        borderRadius: '16px',
        p: 1.5,
        ...(arrived && { borderColor: theme.palette.primary.main }),
      })}
    >
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={(theme) => ({
            width: 56,
            height: 56,
            flexShrink: 0,
            borderRadius: '12px',
            display: 'grid',
            placeItems: 'center',
            color: arrived ? 'primary.contrastText' : 'primary.main',
            bgcolor: arrived ? 'primary.main' : alpha(theme.palette.primary.main, 0.12),
          })}
        >
          {arrived ? (
            <Icon name="check" size={30} />
          ) : (
            <Icon
              name="arrow-up"
              size={32}
              sx={{
                transform: `rotate(${angle ?? 0}deg)`,
                transition: 'transform 250ms ease-out',
                opacity: angle === null ? 0.3 : 1,
              }}
            />
          )}
        </Box>
        <Stack sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" noWrap>
            {target.name}
          </Typography>
          <Typography variant="h5" sx={{ lineHeight: 1.2 }}>
            {distM === null ? '—' : formatDistance(distM)}
          </Typography>
          <Typography variant="caption" color={arrived ? 'primary.main' : 'text.secondary'} noWrap>
            {hint}
          </Typography>
        </Stack>
        <IconButton aria-label="Zakończ prowadzenie" onClick={() => setTarget(null)}>
          <Icon name="times" size={20} />
        </IconButton>
      </Stack>
    </Paper>
  );
}
