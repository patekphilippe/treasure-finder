import { EmptyState, Sheet } from '@/shared/ui';

interface TracksSheetProps {
  onClose: () => void;
}

export function TracksSheet({ onClose }: TracksSheetProps) {
  return (
    <Sheet title="Trasa" onClose={onClose}>
      <EmptyState
        icon="route"
        title="Brak nagranych tras"
        description="Nagrywanie tras z GPS — do przeniesienia z wersji 1 (Etap 0, krok 4)."
      />
    </Sheet>
  );
}
