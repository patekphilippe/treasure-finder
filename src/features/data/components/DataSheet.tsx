import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { OwnMapsSection } from '@/features/history';
import { InstallAppSection, OfflineAreasSection } from '@/features/offline';
import { Sheet } from '@/shared/ui';
import { ExportSection } from './ExportSection';
import { ImportSection } from './ImportSection';
import { NmtSheetPointer } from './NmtSheetPointer';

interface DataSheetProps {
  onClose: () => void;
}

/** Everything loaded or saved: backups, files, own historical maps, offline areas. */
export function DataSheet({ onClose }: DataSheetProps) {
  return (
    <Sheet title="Dane" onClose={onClose}>
      <Stack spacing={2.5}>
        <InstallAppSection />
        <ExportSection />
        <Divider />
        <ImportSection />
        <Divider />
        <OwnMapsSection />
        <Divider />
        <NmtSheetPointer />
        <Divider />
        <OfflineAreasSection />
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
