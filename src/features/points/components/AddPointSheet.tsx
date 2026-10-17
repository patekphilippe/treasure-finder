import { EmptyState, Sheet } from '@/shared/ui';

interface AddPointSheetProps {
  onClose: () => void;
}

export function AddPointSheet({ onClose }: AddPointSheetProps) {
  return (
    <Sheet title="Nowy punkt" onClose={onClose}>
      <EmptyState
        icon="map-marker-alt"
        title="Dodaj punkt"
        description="Formularz z rodzajem, opisem, głębokością i zdjęciem — Etap 0, krok 5."
      />
    </Sheet>
  );
}
