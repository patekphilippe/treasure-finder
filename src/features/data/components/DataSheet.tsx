import { EmptyState, Sheet } from '@/shared/ui';

interface DataSheetProps {
  onClose: () => void;
}

export function DataSheet({ onClose }: DataSheetProps) {
  return (
    <Sheet title="Dane" onClose={onClose}>
      <EmptyState
        icon="database"
        title="Eksport i import"
        description="Kopia ZIP, import kopii z wersji 1 i GeoJSON z QGIS — Etap 0, krok 6."
      />
    </Sheet>
  );
}
