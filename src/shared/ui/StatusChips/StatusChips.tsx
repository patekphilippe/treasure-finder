import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { useFieldStore } from '@/shared/store/useFieldStore';
import { Icon } from '../Icon/Icon';
import { glass } from '../styles/glass';

export function StatusChips() {
  const position = useFieldStore((s) => s.position);
  const gpsError = useFieldStore((s) => s.gpsError);
  const recording = useFieldStore((s) => s.recordingTrackId !== null);

  return (
    <Stack data-tour="gps-chip" direction="row" spacing={0.75}>
      <Chip
        size="small"
        icon={<Icon name="crosshairs" size={16} />}
        label={position ? `±${Math.round(position.accM)} m` : (gpsError ?? 'Brak GPS')}
        sx={(theme) => ({
          ...glass(theme),
          color: position ? 'primary.main' : 'text.secondary',
          '& .MuiChip-icon': { color: 'inherit' },
        })}
      />
      {recording && (
        <Chip
          size="small"
          icon={<Icon name="circle" size={12} />}
          label="Nagrywanie"
          sx={(theme) => ({
            ...glass(theme),
            color: 'error.main',
            '& .MuiChip-icon': { color: 'inherit' },
          })}
        />
      )}
    </Stack>
  );
}
