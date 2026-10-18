import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import type { PointStatus } from '@/shared/types/domain';
import { Icon } from '@/shared/ui';

interface StatusButtonsProps {
  status: PointStatus;
  onChange: (status: PointStatus) => void;
}

const BUTTONS: {
  status: PointStatus;
  label: string;
  icon: string;
  color: 'inherit' | 'warning' | 'error';
}[] = [
  { status: 'pusto', label: 'Pusto', icon: 'times-circle', color: 'inherit' },
  { status: 'znalezisko', label: 'Znalezisko', icon: 'gem', color: 'warning' },
  { status: 'chroniony', label: 'Chronione, zgłoszę', icon: 'shield-alt', color: 'error' },
];

/** One tap sets the result of checking a point in the field. */
export function StatusButtons({ status, onChange }: StatusButtonsProps) {
  return (
    <Stack direction="row" sx={{ gap: 1 }}>
      {BUTTONS.map((b) => {
        const active = status === b.status;
        return (
          <Button
            key={b.status}
            color={b.color}
            variant={active ? 'contained' : 'outlined'}
            onClick={() => onChange(active ? 'do_sprawdzenia' : b.status)}
            aria-pressed={active}
            sx={{
              flex: 1,
              flexDirection: 'column',
              gap: 0.5,
              py: 1.25,
              px: 0.5,
              borderRadius: '12px',
              lineHeight: 1.2,
              whiteSpace: 'normal',
              fontSize: 13,
            }}
          >
            <Icon name={b.icon} size={24} />
            {b.label}
          </Button>
        );
      })}
    </Stack>
  );
}
