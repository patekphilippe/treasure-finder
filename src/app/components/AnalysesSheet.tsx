import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { NmtAnalysisCard } from '@/features/analysis/field';
import { RoughnessCard } from '@/features/roughness';
import { useSourcesActivity } from '@/features/sources';
import { useActivityStore } from '@/shared/store/useActivityStore';
import { Sheet } from '@/shared/ui';
import { ActivityList } from './ActivityList';

interface AnalysesSheetProps {
  onClose: () => void;
}

/** Every analysis in one place: what is running now, then one card per analysis. */
export function AnalysesSheet({ onClose }: AnalysesSheetProps) {
  const running = useActivityStore((s) => s.tasks.length > 0);
  const remote = useSourcesActivity();
  const busy = running || remote.waiting > 0 || remote.ready > 0;

  return (
    <Sheet title="Analizy" onClose={onClose}>
      <Stack data-tour="analyses-hub" spacing={1.5}>
        {busy && (
          <Stack spacing={1}>
            <Typography variant="overline" color="text.secondary">
              W toku
            </Typography>
            <ActivityList />
          </Stack>
        )}
        <Typography variant="body2" color="text.secondary">
          Każda karta mówi, czego analiza potrzebuje. Wyniki trafiają na mapę; analizy trwają dalej
          po zamknięciu tego panelu, a postęp widać u góry ekranu.
        </Typography>
        <NmtAnalysisCard />
        <RoughnessCard />
      </Stack>
    </Sheet>
  );
}
