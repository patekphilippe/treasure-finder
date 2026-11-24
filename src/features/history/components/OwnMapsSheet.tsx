import { Sheet } from '@/shared/ui';
import { OwnMapsSection } from './OwnMapsSection';

interface OwnMapsSheetProps {
  onClose: () => void;
  /** back to Warstwy, where the maps are switched on */
  onBack?: () => void;
}

/** Adding, fitting and removing your old maps, opened from Stare mapy in Warstwy. */
export function OwnMapsSheet({ onClose, onBack }: OwnMapsSheetProps) {
  return (
    <Sheet title="Twoje stare mapy" onClose={onClose} onBack={onBack}>
      <OwnMapsSection />
    </Sheet>
  );
}
