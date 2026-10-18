import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import { InstallAppSection, OfflineAreasSection } from '@/features/offline';
import { Sheet } from '@/shared/ui';
import { ExportSection } from './ExportSection';
import { ImportSection } from './ImportSection';

interface DataSheetProps {
  onClose: () => void;
}

export function DataSheet({ onClose }: DataSheetProps) {
  return (
    <Sheet title="Dane" onClose={onClose}>
      <Stack spacing={2.5}>
        <InstallAppSection />
        <ExportSection />
        <Divider />
        <ImportSection />
        <Divider />
        <OfflineAreasSection />
      </Stack>
    </Sheet>
  );
}
