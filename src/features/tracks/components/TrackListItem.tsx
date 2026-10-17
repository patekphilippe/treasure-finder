import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { formatDate, formatDistance, formatDuration } from '@/shared/lib/format';
import type { Track } from '@/shared/types/domain';
import { Icon } from '@/shared/ui';

interface TrackListItemProps {
  track: Track;
  onDelete: () => void;
}

export function TrackListItem({ track, onDelete }: TrackListItemProps) {
  return (
    <Stack
      direction="row"
      sx={{ alignItems: 'center', gap: 1.5, py: 1.25, borderTop: 1, borderColor: 'divider' }}
    >
      <Icon name="route" size={22} sx={{ color: 'text.secondary' }} />
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap>
          {track.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatDate(track.start)} · {formatDistance(track.distM)}
          {track.end !== null && ` · ${formatDuration(track.end - track.start)}`}
        </Typography>
      </Stack>
      <IconButton size="small" aria-label={`Usuń ${track.name}`} onClick={onDelete}>
        <Icon name="trash-alt" size={20} />
      </IconButton>
    </Stack>
  );
}
