import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { formatDistance, formatDuration } from '@/shared/lib/format';
import type { Track } from '@/shared/types/domain';
import { Icon } from '@/shared/ui';
import { useNow } from '../hooks/useNow';

interface RecordingPanelProps {
  track: Track | null;
  onStart: () => void;
  onStop: () => void;
}

export function RecordingPanel({ track, onStart, onStop }: RecordingPanelProps) {
  const now = useNow(track !== null);

  if (!track) {
    return (
      <Button
        fullWidth
        size="large"
        variant="contained"
        startIcon={<Icon name="play" size={20} />}
        onClick={onStart}
      >
        Rozpocznij nagrywanie
      </Button>
    );
  }

  return (
    <Box
      sx={(theme) => ({
        p: 2,
        borderRadius: '12px',
        bgcolor: alpha(theme.palette.error.main, 0.08),
        border: `1px solid ${alpha(theme.palette.error.main, 0.24)}`,
      })}
    >
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor: 'error.main',
            animation: 'rec-pulse 1.4s ease-in-out infinite',
            '@keyframes rec-pulse': { '50%': { opacity: 0.3 } },
          }}
        />
        <Typography variant="subtitle2" color="error.main">
          Nagrywanie
        </Typography>
      </Stack>
      <Stack direction="row" sx={{ gap: 3, mb: 2 }}>
        <Box>
          <Typography variant="h5">{formatDistance(track.distM)}</Typography>
          <Typography variant="caption" color="text.secondary">
            Dystans
          </Typography>
        </Box>
        <Box>
          <Typography variant="h5">{formatDuration(now - track.start)}</Typography>
          <Typography variant="caption" color="text.secondary">
            Czas
          </Typography>
        </Box>
      </Stack>
      <Button
        fullWidth
        variant="contained"
        color="error"
        startIcon={<Icon name="stop" size={20} />}
        onClick={onStop}
      >
        Zakończ trasę
      </Button>
    </Box>
  );
}
