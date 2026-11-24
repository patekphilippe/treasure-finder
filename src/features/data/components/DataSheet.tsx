import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { InstallAppSection } from '@/features/offline';
import { Sheet } from '@/shared/ui';
import { ExportSection } from './ExportSection';
import { ImportSection } from './ImportSection';

interface DataSheetProps {
  onClose: () => void;
}

/** Kopia: save everything to one file, or load such a file (and installing the app). */
export function DataSheet({ onClose }: DataSheetProps) {
  return (
    <Sheet title="Kopia" onClose={onClose}>
      <Stack spacing={2}>
        <InstallAppSection />
        <Typography variant="body2" color="text.secondary">
          Punkty, trasy, zdjęcia i Twoje mapy są zapisane tylko w tym urządzeniu. Zrób kopię, żeby
          ich nie stracić albo przenieść je na inny telefon lub komputer.
        </Typography>
        <ExportSection />
        <ImportSection />
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          Wersja {__APP_BUILD__.commit} z{' '}
          {new Date(__APP_BUILD__.at).toLocaleString('pl-PL', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Typography>
      </Stack>
    </Sheet>
  );
}
