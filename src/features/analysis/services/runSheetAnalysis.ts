import { getDb } from '@/shared/db';
import type { Candidate } from '@/shared/types/domain';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { sheetIdFromName } from '../utils/sheetIdFromName';
import type {
  AnalysisRequest,
  AnalysisResponse,
  ExclusionResult,
  SheetInfo,
} from '../workers/messages';
import { exclusionPrefix } from './saveSheetResults';

export class AnalysisCancelled extends Error {}

let current: { worker: Worker; reject: (e: Error) => void } | null = null;

/** Stops the running analysis (a busy worker cannot receive messages, so it is terminated). */
export function cancelSheetAnalysis(): void {
  if (!current) return;
  current.worker.terminate();
  current.reject(new AnalysisCancelled());
  current = null;
  useAnalysisStore.getState().setRun(null);
}

/**
 * Analyses an NMT sheet file in a worker. Archival context, BDOT10k water and forbidden zones
 * come from the database; the sheet's own exclusion zones are left out, the analysis rebuilds them.
 */
export async function runSheetAnalysis(
  file: File,
  excludeBuildings = true,
): Promise<{ sheet: SheetInfo; candidates: Candidate[]; exclusion: ExclusionResult | null }> {
  cancelSheetAnalysis();
  const setRun = useAnalysisStore.getState().setRun;
  setRun({ name: file.name, share: 0, step: 'Wczytywanie pliku' });
  const db = await getDb();
  const context = (await db.getAll('context')).map((c) => c.geometry);
  const own = exclusionPrefix(sheetIdFromName(file.name));
  const forbidden = (await db.getAll('zones'))
    .filter((z) => z.kind === 'zakaz' && !z.id.startsWith(own))
    .map((z) => z.geometry);
  const request: AnalysisRequest = {
    name: file.name,
    buffer: await file.arrayBuffer(),
    context,
    water: (await db.getAll('water')).map((w) => w.geometry),
    forbidden,
    excludeBuildings,
  };
  const worker = new Worker(new URL('../workers/analysis.worker.ts', import.meta.url), {
    type: 'module',
  });
  try {
    return await new Promise((resolve, reject) => {
      current = { worker, reject };
      worker.onmessage = (e: MessageEvent<AnalysisResponse>) => {
        const msg = e.data;
        if (msg.type === 'progress') setRun({ name: file.name, share: msg.share, step: msg.step });
        else if (msg.type === 'done')
          resolve({ sheet: msg.sheet, candidates: msg.candidates, exclusion: msg.exclusion });
        else reject(new Error(msg.message));
      };
      worker.onerror = (e) => reject(new Error(e.message || 'Analiza nie powiodła się'));
      worker.postMessage(request, [request.buffer]);
    });
  } finally {
    worker.terminate();
    if (current?.worker === worker) current = null;
    setRun(null);
  }
}
