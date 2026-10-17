import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { usePointDraftStore } from '@/shared/store/usePointDraftStore';
import { glass } from '@/shared/ui';

/** Compact bar shown instead of the form while the user aims the crosshair. */
export function PickLocationBar() {
  const finishPicking = usePointDraftStore((s) => s.finishPicking);
  const setSource = usePointDraftStore((s) => s.setSource);

  const confirm = () => {
    const { center } = useMapViewStore.getState();
    finishPicking(center.lat, center.lng);
  };

  return (
    <Paper
      sx={(theme) => ({
        ...glass(theme),
        position: 'absolute',
        zIndex: 1050,
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 92px)',
        width: 'min(calc(100% - 24px), 440px)',
        borderRadius: '16px',
        p: 1.5,
      })}
    >
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" sx={{ flex: 1, pl: 0.5 }}>
          Przesuń mapę, aby ustawić celownik
        </Typography>
        <Button color="inherit" onClick={() => setSource('gps')}>
          Anuluj
        </Button>
        <Button variant="contained" onClick={confirm}>
          Gotowe
        </Button>
      </Stack>
    </Paper>
  );
}
