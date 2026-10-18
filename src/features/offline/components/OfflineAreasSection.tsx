import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useUiStore } from '@/shared/store/useUiStore';
import { Icon } from '@/shared/ui';
import { useOfflineStore } from '../store/useOfflineStore';

/** Section in Dane: download a map area for work without signal. */
export function OfflineAreasSection() {
  const startSelecting = useOfflineStore((s) => s.startSelecting);
  const closeSheet = useUiStore((s) => s.closeSheet);

  return (
    <Stack data-tour="data-offline" spacing={1.25}>
      <Typography variant="overline" color="text.secondary">
        Mapy offline
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Ortofotomapa i cieniowanie NMT wybranego obszaru (przybliżenia 12–19) do pracy w terenie bez
        zasięgu.
      </Typography>
      <Button
        variant="outlined"
        color="inherit"
        startIcon={<Icon name="download" size={20} />}
        onClick={() => {
          closeSheet();
          startSelecting();
        }}
      >
        Pobierz obszar mapy
      </Button>
    </Stack>
  );
}
