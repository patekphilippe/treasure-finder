import Fade from '@mui/material/Fade';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import {
  BESIDE_DOCK_MIN_WIDTH,
  besideDockBottom,
  DOCK_BOTTOM_PX,
  DOCK_HEIGHT_PX,
} from '@/shared/config/layout';
import { useUiStore } from '@/shared/store/useUiStore';
import { glass } from '@/shared/ui';
import { useLegendShown } from '../hooks/useLegendShown';
import { useTileProgress } from '../hooks/useTileProgress';

/** Short loads would only flicker; the bar shows once loading takes longer than this. */
const SHOW_AFTER_MS = 300;
/** height of this card and of the legend's header row, to line them up with the dock */
const PROGRESS_HEIGHT_PX = 42;
const LEGEND_HEADER_PX = 40;

/** Small bar in the bottom-left corner while map tiles load after zooming or panning. */
export function TileProgressBar() {
  const progress = useTileProgress();
  const analysis = useUiStore((s) => s.mode === 'analysis');
  const legendShown = useLegendShown();
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
          // Teren: bottom left, above the legend when it is shown, else above (or beside) the dock
          ...(analysis
            ? {
                // phone: the candidate panel fills the bottom, so the second row at the top
                top: 'calc(env(safe-area-inset-top, 0px) + 64px)',
                right: 12,
                // laptop: the panel is on the right, the bottom-left corner is free
                [theme.breakpoints.up('md')]: {
                  top: 'auto',
                  right: 'auto',
                  bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
                  left: 12,
                },
              }
            : {
                left: 12,
                bottom: `calc(env(safe-area-inset-bottom, 0px) + ${legendShown ? 140 : 92}px)`,
                // the legend sits at the dock's level here (40 px header)
                [theme.breakpoints.up(BESIDE_DOCK_MIN_WIDTH)]: {
                  bottom: legendShown
                    ? `calc(env(safe-area-inset-bottom, 0px) + ${DOCK_BOTTOM_PX + (DOCK_HEIGHT_PX - LEGEND_HEADER_PX) / 2 + LEGEND_HEADER_PX + 8}px)`
                    : besideDockBottom(PROGRESS_HEIGHT_PX),
                },
              }),
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
