import { bottomSheetOffset } from '@/shared/lib/bottomSheetOffset';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { useToastStore } from '@/shared/ui';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { useReliefStore } from '../store/useReliefStore';
import { AnalysisCancelled, runSheetAnalysis } from './runSheetAnalysis';
import { saveSheetReliefs } from './saveSheetReliefs';
import { saveSheetResults } from './saveSheetResults';

/**
 * An NMT sheet file from start to the saved candidates: the analysis in the worker, then the
 * results, reliefs and BDOT10k exclusion stored, and the map flown to the best candidate. The run
 * state (and the activity chip) lasts until everything is saved, whichever view is open.
 */
export async function analyseSheetFile(file: File): Promise<void> {
  const showToast = useToastStore.getState().show;
  try {
    const { sheet, candidates, exclusion, reliefs } = await runSheetAnalysis(file);
    useAnalysisStore.getState().setRun({ name: file.name, share: 1, step: 'Zapisywanie wyników' });
    useAnalysisStore.getState().setExclusion(
      exclusion && {
        ...exclusion,
        sheetId: sheet.sheetId,
        originE: sheet.originE,
        originN: sheet.originN,
        res: sheet.cell,
        w: sheet.cols,
        h: sheet.rows,
      },
    );
    const { added } = await saveSheetResults(sheet.sheetId, candidates);
    await saveSheetReliefs(sheet, reliefs);
    // the first analysed sheet shows its LRM right away
    if (useReliefStore.getState().kind === null) useReliefStore.getState().setKind('lrm');
    const best = useAnalysisStore
      .getState()
      .candidates.filter(
        (c) =>
          c.sheetId === sheet.sheetId &&
          c.priority !== 'naturalne' &&
          c.interpretation !== 'nieokreslona',
      )
      .sort((a, b) => b.score - a.score)[0];
    if (best)
      useMapViewStore
        .getState()
        .flyTo({ lat: best.lat, lng: best.lng, zoom: 15, offsetY: bottomSheetOffset() });
    const failed = exclusion?.groups.filter((g) => g.status === 'error').map((g) => g.label);
    showToast(
      `Arkusz ${sheet.sheetId}: ${candidates.length} form, nowych ${Math.max(0, added)}` +
        (failed?.length ? `. BDOT10k nie pobrano: ${failed.join(', ')}` : ''),
    );
  } catch (e) {
    if (!(e instanceof AnalysisCancelled))
      showToast(e instanceof Error ? e.message : 'Analiza nie powiodła się');
  } finally {
    useAnalysisStore.getState().setRun(null);
  }
}
