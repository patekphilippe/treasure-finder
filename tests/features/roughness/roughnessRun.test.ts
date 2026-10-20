import { beforeEach, describe, expect, it, vi } from 'vitest';

let finish: (() => void) | null = null;
let report: ((p: number) => void) | null = null;
const closed: string[] = [];

vi.mock('@/features/roughness/services/analyzeView', () => ({
  analyzeView: (_b: unknown, onProgress: (p: number) => void) =>
    new Promise((resolve) => {
      report = onProgress;
      const id = `r${closed.length}-${Math.random()}`;
      finish = () =>
        resolve({
          raster: { image: { close: () => closed.push(id) } },
          hotspots: [{}, {}],
          analysedAt: 0,
        });
    }),
}));
vi.mock('@/features/roughness/store/useAreasStore', () => ({
  useAreasStore: { getState: () => ({ saveFromAnalysis: async () => 1 }) },
}));

const { useRoughnessStore } = await import('@/features/roughness/store/useRoughnessStore');
const { useActivityStore } = await import('@/shared/store/useActivityStore');
const { useToastStore } = await import('@/shared/ui');

const bounds = { south: 50, west: 15, north: 50.01, east: 15.01 };
const task = () => useActivityStore.getState().tasks.find((t) => t.id === 'roughness');

describe('uneven ground analysis as a background task', () => {
  beforeEach(() => {
    closed.length = 0;
    useActivityStore.setState({ tasks: [] });
    useRoughnessStore.setState({ status: 'idle', result: null, error: null, progress: 0 });
  });

  it('shows on the chip with the tile progress, ends with a toast', async () => {
    const run = useRoughnessStore.getState().run(bounds);
    expect(task()).toMatchObject({ short: 'Teren nierówny', share: 0 });
    report!(0.5);
    expect(task()).toMatchObject({ share: 0.5, step: 'Pobieram cieniowanie NMT' });
    report!(1);
    expect(task()).toMatchObject({ share: null, step: 'Analizuję i pomijam zabudowę' });
    finish!();
    await run;
    expect(task()).toBeUndefined();
    expect(useRoughnessStore.getState().status).toBe('done');
    expect(useToastStore.getState().message).toBe('Oznaczono miejsc: 2 (nowych: 1)');
  });

  it('"Przerwij" ends the task at once and drops the late result', async () => {
    const run = useRoughnessStore.getState().run(bounds);
    task()!.cancel!();
    expect(task()).toBeUndefined();
    expect(useRoughnessStore.getState().status).toBe('idle');
    finish!();
    await run;
    expect(useRoughnessStore.getState().result).toBeNull();
    expect(closed).toHaveLength(1);
  });
});
