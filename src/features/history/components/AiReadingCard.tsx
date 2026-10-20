import Button from '@mui/material/Button';
import { useUiStore } from '@/shared/store/useUiStore';
import { AnalysisCard, Icon } from '@/shared/ui';
import { useViewSource } from '../hooks/useViewSource';
import { useProposalsStore } from '../store/useProposalsStore';
import { AiReadingSection } from './AiReadingSection';

/** Analizy: Claude reads the historical map in view; proposals wait here to be accepted. */
export function AiReadingCard() {
  const source = useViewSource();
  const step = useProposalsStore((s) => s.step);
  const proposals = useProposalsStore((s) => s.proposals.length);
  const showSheet = useUiStore((s) => s.showSheet);
  const status = step
    ? `W toku: ${step.toLowerCase()}`
    : proposals
      ? `Propozycje do przejrzenia: ${proposals}`
      : source
        ? `Widoczna mapa: ${source.label}`
        : 'Brak widocznej mapy historycznej';

  return (
    <AnalysisCard
      data-tour="analyses-ai"
      card="ai"
      icon="search-location"
      title="Odczyt mapy historycznej (AI)"
      needs="widoczna mapa historyczna albo własna, internet"
      status={status}
    >
      {!source && (
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<Icon name="layer-group" size={18} />}
          onClick={() => showSheet('layers')}
        >
          Włącz mapę w Warstwach
        </Button>
      )}
      <AiReadingSection />
    </AnalysisCard>
  );
}
