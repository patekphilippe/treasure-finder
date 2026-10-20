import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useSourcesActivity } from '@/features/sources';
import { pluralPl } from '@/shared/lib/format';
import { useUiStore } from '@/shared/store/useUiStore';
import { Icon } from '@/shared/ui';

interface SourcesActivityRowProps {
  onNavigate?: () => void;
}

/** Sent sources in the activity list: new results to look at, and those still on the server. */
export function SourcesActivityRow({ onNavigate }: SourcesActivityRowProps) {
  const { waiting, ready } = useSourcesActivity();
  const goTo = useUiStore((s) => s.goTo);
  if (!waiting && !ready) return null;
  const text = [
    ready > 0 && `nowe wyniki: ${ready}`,
    waiting > 0 && `na serwerze ${pluralPl(waiting, 'zgłoszenie', 'zgłoszenia', 'zgłoszeń')}`,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
      <Icon name={ready ? 'check-circle' : 'hourglass-half'} size={20} />
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2">Źródła wysłane do analizy</Typography>
        <Typography variant="caption" color="text.secondary">
          {text.charAt(0).toUpperCase() + text.slice(1)}
        </Typography>
      </Stack>
      <Button
        size="small"
        onClick={() => {
          goTo({ mode: 'field', sheet: 'sources' });
          onNavigate?.();
        }}
      >
        Pokaż
      </Button>
    </Stack>
  );
}
