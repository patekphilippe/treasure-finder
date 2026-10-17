import Stack from '@mui/material/Stack';
import { Sheet } from '@/shared/ui';
import { ExportSection } from './ExportSection';

interface DataSheetProps {
  onClose: () => void;
}

export function DataSheet({ onClose }: DataSheetProps) {
  return (
    <Sheet title="Dane" onClose={onClose}>
      <Stack spacing={2.5}>
        <ExportSection />
      </Stack>
    </Sheet>
  );
}
