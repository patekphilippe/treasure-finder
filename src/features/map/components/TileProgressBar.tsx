import Fade from '@mui/material/Fade';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { useUiStore } from '@/shared/store/useUiStore';
import { glass } from '@/shared/ui';
import { useTileProgress } from '../hooks/useTileProgress';

/** Short loads would only flicker; the bar shows once loading takes longer than this. */
const SHOW_AFTER_MS = 300;

/** Small bar in the top-right corner while map tiles load after zooming or panning. */
export function TileProgressBar() {
  const progress = useTileProgress();
  const analysis = useUiStore((s) => s.mode === 'analysis');
  const loading = progress !== null;
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShown(loading), loading ? SHOW_AFTER_MS : 0);
    return () => clearTimeout(t);
  }, [loading]);

  const share = progress ? progress.done / progress.total : 1;

  return (
    <Fade in={shown && loading}>
      <Paper
        role="progressbar"
        aria-label="Wczytywanie mapy"
        aria-valuenow={Math.round(share * 100)}
        sx={(theme) => ({
          ...glass(theme),
          position: 'absolute',
          zIndex: 1000,
          // phone: the row of the GPS chip, the mode switch fills the top row
          top: {
            xs: 'calc(env(safe-area-inset-top, 0px) + 64px)',
            sm: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          },
          // in Analiza the candidate panel takes the right side on a laptop
          right: { xs: 12, md: analysis ? 424 : 12 },
          width: 148,
          px: 1.25,
          py: 0.75,
          borderRadius: '12px',
          pointerEvents: 'none',
        })}
      >
        <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary" noWrap>
            Wczytuję mapę
          </Typography>
          <Typography variant="caption" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {Math.round(share * 100)}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={share * 100}
          sx={{ height: 4, borderRadius: 2, bgcolor: 'action.selected' }}
        />
      </Paper>
    </Fade>
  );
}
