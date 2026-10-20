import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useSourcesActivity } from '@/features/sources';
import { useActivityStore } from '@/shared/store/useActivityStore';
import { ActivityRow } from './ActivityRow';
import { SourcesActivityRow } from './SourcesActivityRow';

interface ActivityListProps {
  onNavigate?: () => void;
}

/** Everything the app is doing now, with progress and the way to each task's view. */
export function ActivityList({ onNavigate }: ActivityListProps) {
  const tasks = useActivityStore((s) => s.tasks);
  const remote = useSourcesActivity();
  if (tasks.length === 0 && !remote.waiting && !remote.ready)
    return (
      <Typography variant="body2" color="text.secondary">
        Nic teraz nie trwa.
      </Typography>
    );
  return (
    <Stack spacing={1.5} divider={<Divider flexItem />}>
      {tasks.map((t) => (
        <ActivityRow key={t.id} task={t} onNavigate={onNavigate} />
      ))}
      {(remote.waiting > 0 || remote.ready > 0) && <SourcesActivityRow onNavigate={onNavigate} />}
    </Stack>
  );
}
