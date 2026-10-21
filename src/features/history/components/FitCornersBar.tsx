import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { glass, useToastStore } from '@/shared/ui';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { autoReadMap } from '../services/autoReadMap';
import { shareMap } from '../services/shareMap';

/** Bottom bar while fitting a scan: how to do it, see-through slider, done / cancel. */
export function FitCornersBar() {
  const fitting = useOwnMapsStore((s) => s.fitting);
  const map = useOwnMapsStore((s) => s.maps.find((m) => m.id === s.fitting?.id));
  const { finishFit, cancelFit } = useOwnMapsStore();
  const showToast = useToastStore((s) => s.show);
  if (!fitting || !map) return null;

  const setOpacity = (opacity: number) =>
    useOwnMapsStore.setState((s) => ({
      maps: s.maps.map((m) => (m.id === map.id ? { ...m, opacity } : m)),
    }));

  return (
    <Paper
      data-tour="fit-corners"
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
      <Stack spacing={1}>
        <Typography variant="subtitle2" noWrap>
          Dopasuj: {map.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Przeciągaj zielone narożniki 1–4, aż drogi, rzeki i wsie na skanie pokryją się z
          ortofotomapą. Najlepiej przy podkładzie Ortofoto i dużym przybliżeniu.
        </Typography>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 2, px: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40 }}>
            Krycie
          </Typography>
          <Slider
            size="small"
            min={0.2}
            max={1}
            step={0.05}
            value={map.opacity}
            onChange={(_, v) => setOpacity(v as number)}
            aria-label="Krycie dopasowywanej mapy"
          />
        </Stack>
        <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 1 }}>
          <Button color="inherit" onClick={cancelFit}>
            Anuluj
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              void finishFit().then(() => {
                showToast(`Zapisano dopasowanie: ${map.name}`);
                // placed: on the server for the community, then Claude reads it whole (once)
                void shareMap(map.id).finally(() => autoReadMap(map.id));
              });
            }}
          >
            Gotowe
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
