import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { formatDate } from '@/shared/lib/format';
import { Icon } from '@/shared/ui';
import { useZoneAlertStore } from '../store/useZoneAlertStore';

/** Red bar at the top while inside a forbidden zone or outside a valid permit zone. */
export function ZoneAlertBar() {
  const alert = useZoneAlertStore((s) => s.alert);
  if (!alert) return null;

  let title: string;
  let detail: string;
  if (alert.kind === 'zakaz') {
    title = `Strefa zakazu: ${alert.zone.name}`;
    detail = 'Nie prowadź tu poszukiwań — wyjdź poza strefę.';
  } else if (alert.kind === 'zgoda_wygasla') {
    title = 'Zgoda wygasła';
    detail = `${alert.zone.name}${alert.zone.validUntil ? ` — ważna do ${formatDate(alert.zone.validUntil)}` : ''}`;
  } else {
    title = 'Poza strefą zgody';
    detail = 'Tu nie masz zgody właściciela ani zgłoszenia.';
  }

  return (
    <Paper
      role="alert"
      sx={{
        width: 'min(calc(100vw - 24px), 560px)',
        bgcolor: 'error.main',
        color: '#fff',
        borderRadius: '12px',
        px: 2,
        py: 1.25,
        animation: 'zone-alert 1.2s ease-in-out infinite',
        '@keyframes zone-alert': { '50%': { filter: 'brightness(1.15)' } },
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
        <Icon name="exclamation-triangle" size={26} />
        <Stack sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
            {title}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            {detail}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}
