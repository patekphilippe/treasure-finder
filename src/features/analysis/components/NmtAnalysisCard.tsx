import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { countCandidates, pluralPl } from '@/shared/lib/format';
import { useUiStore } from '@/shared/store/useUiStore';
import { AnalysisCard, Icon } from '@/shared/ui';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { AnalysisProgress } from './AnalysisProgress';
import { LoadSheetButton } from './LoadSheetButton';

/** Analizy: forms of terrain from an NMT sheet; the candidates are reviewed in Kandydaci. */
export function NmtAnalysisCard() {
  const run = useAnalysisStore((s) => s.run);
  const candidates = useAnalysisStore((s) => s.candidates);
  const setMode = useUiStore((s) => s.setMode);
  const sheets = new Set(candidates.map((c) => c.sheetId)).size;
  const toReview = candidates.filter(
    (c) => c.decision === 'nowy' && c.priority !== 'naturalne',
  ).length;
  const status = run
    ? `W toku: ${Math.round(run.share * 100)}%, ${run.step.toLowerCase()}`
    : candidates.length
      ? `${countCandidates(candidates.length)} z ${pluralPl(sheets, 'arkusza', 'arkuszy', 'arkuszy')}, do oceny: ${toReview}`
      : 'Nie wczytano jeszcze arkusza';

  return (
    <AnalysisCard
      data-tour="analyses-nmt"
      card="nmt"
      icon="mountain"
      title="Formy terenu z arkusza NMT"
      needs="plik .asc albo GeoTIFF z Geoportalu (EPSG:2180)"
      status={status}
    >
      <Typography variant="body2" color="text.secondary">
        Rozpoznaje leje, okopy, ziemianki, kurhany i dawne drogi, pomija zabudowę i wskazuje strefy
        poszukiwań. Cały arkusz najlepiej liczyć na komputerze; wyniki przeglądasz w trybie
        Kandydaci.
      </Typography>
      <LoadSheetButton variant="full" />
      <AnalysisProgress />
      {candidates.length > 0 && (
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<Icon name="clipboard-list" size={18} />}
          onClick={() => setMode('analysis')}
        >
          Pokaż kandydatów
        </Button>
      )}
    </AnalysisCard>
  );
}
