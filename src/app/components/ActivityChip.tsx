import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Fade from '@mui/material/Fade';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import type { Theme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useState } from 'react';
import { useSourcesActivity } from '@/features/sources';
import { useActivityStore } from '@/shared/store/useActivityStore';
import { glass, Icon } from '@/shared/ui';
import { activitySummary } from '../utils/activitySummary';
import { ActivityList } from './ActivityList';

/** shorter tasks never show: the chip fades in only after this */
const SHOW_AFTER_MS = 400;

/**
 * Top-bar chip, in both modes, while something runs ("Arkusz NMT 45%", "W toku: 2"), a result
 * of a sent source is new ("Gotowe: 1") or sources wait on the server ("Na serwerze: 1").
 * Tapping it lists the tasks with their progress, "Pokaż" and "Przerwij".
 */
export function ActivityChip() {
  const tasks = useActivityStore((s) => s.tasks);
  const compact = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const remote = useSourcesActivity();
  const summary = activitySummary(tasks, remote, compact);
  if (!summary) return null;

  return (
    <>
      <Fade in appear timeout={200} style={{ transitionDelay: `${SHOW_AFTER_MS}ms` }}>
        <Chip
          data-tour="activity"
          aria-label="Co teraz trwa"
          icon={
            summary.tone === 'busy' ? (
              <CircularProgress
                size={16}
                thickness={5}
                variant={summary.share === null ? 'indeterminate' : 'determinate'}
                value={Math.max(4, Math.round((summary.share ?? 0) * 100))}
              />
            ) : (
              <Icon name={summary.tone === 'ready' ? 'check-circle' : 'hourglass-half'} size={18} />
            )
          }
          label={summary.label}
          onClick={(e) => setAnchor(e.currentTarget)}
          sx={(theme) => ({
            ...glass(theme),
            height: 40,
            px: 0.5,
            // a long task name ends in "…" instead of running off the screen
            maxWidth: 'min(70vw, 320px)',
            fontWeight: 600,
            color: summary.tone === 'ready' ? 'primary.main' : 'text.primary',
            '& .MuiChip-icon': { color: summary.tone === 'busy' ? 'primary.main' : 'inherit' },
          })}
        />
      </Fade>
      <Popover
        open={anchor !== null}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: (theme: Theme) => ({
              ...glass(theme),
              borderRadius: '16px',
              p: 2,
              mt: 1,
              width: 320,
              maxWidth: 'calc(100vw - 24px)',
            }),
          },
        }}
      >
        <Typography variant="overline" color="text.secondary">
          {tasks.length ? 'W toku' : 'Analizy na serwerze'}
        </Typography>
        <ActivityList onNavigate={() => setAnchor(null)} />
      </Popover>
    </>
  );
}
