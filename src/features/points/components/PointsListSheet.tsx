import { EmptyState, Sheet } from '@/shared/ui';

interface PointsListSheetProps {
  onClose: () => void;
}

export function PointsListSheet({ onClose }: PointsListSheetProps) {
  return (
    <Sheet title="Punkty" onClose={onClose}>
      <EmptyState
        icon="list-ul"
        title="Brak punktów"
        description="Lista sortowana po odległości — do przeniesienia z wersji 1 (Etap 0, krok 5)."
      />
    </Sheet>
  );
}
