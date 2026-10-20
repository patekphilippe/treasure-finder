import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Activity } from '@/shared/store/useActivityStore';
import { useUiStore } from '@/shared/store/useUiStore';

interface ActivityRowProps {
  task: Activity;
  /** called after "Pokaż" moved to the task's view (closes the list) */
  onNavigate?: () => void;
}

/** One running task: name, progress, what it does now, "Pokaż" and "Przerwij". */
export function ActivityRow({ task, onNavigate }: ActivityRowProps) {
  const mode = useUiStore((s) => s.mode);
  const sheet = useUiStore((s) => s.activeSheet);
  const goTo = useUiStore((s) => s.goTo);
  const { open } = task;
  const elsewhere = open !== null && (open.mode !== mode || (open.sheet ?? null) !== sheet);

  return (
    <Stack spacing={0.5}>
      <Stack direction="row" sx={{ alignItems: 'baseline', gap: 1 }}>
        <Typography variant="subtitle2" noWrap sx={{ flex: 1, minWidth: 0 }}>
          {task.label}
        </Typography>
        {task.share !== null && (
          <Typography variant="caption" color="text.secondary">
            {Math.round(task.share * 100)}%
          </Typography>
        )}
      </Stack>
      <LinearProgress
        variant={task.share === null ? 'indeterminate' : 'determinate'}
        value={Math.round((task.share ?? 0) * 100)}
        sx={{ height: 4, borderRadius: '2px' }}
      />
      <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5, minHeight: 30 }}>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1, minWidth: 0 }}>
          {task.step ?? ''}
        </Typography>
        {elsewhere && (
          <Button
            size="small"
            onClick={() => {
              goTo(open);
              onNavigate?.();
            }}
          >
            Pokaż
          </Button>
        )}
        {task.cancel && (
          <Button size="small" color="inherit" onClick={task.cancel}>
            Przerwij
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
