import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RunState } from '@/features/analysis/store/useAnalysisStore';

const runs: (RunState | null)[] = [];
let fail: Error | null = null;

vi.mock('@/features/analysis/services/runSheetAnalysis', () => ({
  AnalysisCancelled: class extends Error {},
  runSheetAnalysis: async () => {
    if (fail) throw fail;
    return {
      sheet: { sheetId: 'T', originE: 0, originN: 0, cell: 1, cols: 1, rows: 1 },
      candidates: [],
      exclusion: null,
      reliefs: [],
    };
  },
}));
vi.mock('@/features/analysis/services/saveSheetResults', () => ({
  saveSheetResults: async () => {
    runs.push(useAnalysisStore.getState().run);
    return { added: 0 };
  },
}));
vi.mock('@/features/analysis/services/saveSheetReliefs', () => ({
  saveSheetReliefs: async () => {
    runs.push(useAnalysisStore.getState().run);
  },
}));

const { analyseSheetFile } = await import('@/features/analysis/services/analyseSheetFile');
const { useAnalysisStore } = await import('@/features/analysis/store/useAnalysisStore');
const { useActivityStore } = await import('@/shared/store/useActivityStore');
const { useToastStore } = await import('@/shared/ui');

describe('analysing a sheet file', () => {
  beforeEach(() => {
    runs.length = 0;
    fail = null;
    useActivityStore.setState({ tasks: [] });
  });

  it('the run lasts through saving the results, then the chip task ends', async () => {
    useAnalysisStore.getState().setRun({ name: 'a.asc', share: 0.9, step: 'Relief' });
    expect(useActivityStore.getState().tasks[0]).toMatchObject({
      id: 'nmt',
      short: 'Arkusz NMT',
      share: 0.9,
      open: { mode: 'analysis' },
    });
    await analyseSheetFile(new File(['x'], 'a.asc'));
    expect(runs.map((r) => r?.step)).toEqual(['Zapisywanie wyników', 'Zapisywanie wyników']);
    expect(useAnalysisStore.getState().run).toBeNull();
    expect(useActivityStore.getState().tasks).toEqual([]);
    expect(useToastStore.getState().message).toMatch(/^Arkusz T: 0 form/);
  });

  it('a failed analysis ends the task and says why', async () => {
    fail = new Error('Plik nie jest arkuszem NMT');
    await analyseSheetFile(new File(['x'], 'b.asc'));
    expect(useActivityStore.getState().tasks).toEqual([]);
    expect(useToastStore.getState().message).toBe('Plik nie jest arkuszem NMT');
  });
});
