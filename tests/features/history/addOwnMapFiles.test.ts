import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OwnMap } from '@/shared/types/domain';

const seen: { step: string | null; importing: string | null }[] = [];
let importResult: 'fit' | 'placed' | 'crs' = 'fit';

const autoRead = vi.fn<(id: string) => Promise<void>>(async () => {});
// the background AI reading after placing (its own browser code stays out of this test)
vi.mock('@/features/history/services/autoReadMap', () => ({
  autoReadMap: (id: string) => autoRead(id),
}));
vi.mock('@/features/history/services/placeOwnMap', () => ({
  placeOwnMap: async () => {
    record();
    return {
      corners: [],
      method: 'nazwy',
      anchors: ['Kowary'],
      uncertaintyM: 120,
      rmsM: 80,
      series: 'wig100',
      year: 1921,
      sheetNumber: null,
    };
  },
}));
vi.mock('@/features/history/services/importOwnMap', () => ({
  NeedCrsError: class extends Error {},
  mapCorners2180: () => [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ],
  importOwnMap: async (_files: File[], opts: { year?: number }) => {
    record();
    if (importResult === 'crs') {
      const { NeedCrsError } = await import('@/features/history/services/importOwnMap');
      throw new NeedCrsError('');
    }
    return {
      map: { id: 'm1', name: 'mapa', year: opts.year } as OwnMap,
      needsFit: importResult === 'fit',
    };
  },
}));

const { addOwnMapFiles } = await import('@/features/history/services/addOwnMapFiles');
const { useOwnMapsStore } = await import('@/features/history/store/useOwnMapsStore');
const { useActivityStore } = await import('@/shared/store/useActivityStore');

function record() {
  seen.push({
    step: useActivityStore.getState().tasks.find((t) => t.id === 'own-map')?.step ?? null,
    importing: useOwnMapsStore.getState().importing,
  });
}

const scan = new File(['x'], 'wig.jpg', { type: 'image/jpeg' });

describe('adding an own map as a background task', () => {
  const added: OwnMap[] = [];
  const fitted: string[] = [];
  beforeEach(() => {
    seen.length = 0;
    added.length = 0;
    fitted.length = 0;
    importResult = 'fit';
    autoRead.mockClear();
    useActivityStore.setState({ tasks: [] });
    useOwnMapsStore.setState({
      importing: null,
      add: async (m) => void added.push(m),
      startFit: (id) => void fitted.push(id),
    });
  });

  it('placed by the backend, then read: the chip shows both steps, then fitting starts', async () => {
    expect(await addOwnMapFiles([scan], { auto: true })).toBe('done');
    expect(seen).toEqual([
      { step: 'Umieszczam mapę po nazwach (AI)', importing: 'wig.jpg' },
      { step: 'Wczytuję obraz', importing: 'wig.jpg' },
    ]);
    expect(added[0]?.year).toBe(1921);
    expect(fitted).toEqual(['m1']);
    // a scan still to be fitted is read after "Gotowe", not now
    expect(autoRead).not.toHaveBeenCalled();
    expect(useActivityStore.getState().tasks).toEqual([]);
    expect(useOwnMapsStore.getState().importing).toBeNull();
  });

  it('a georeferenced map needs no fitting: Claude starts reading it at once', async () => {
    importResult = 'placed';
    expect(await addOwnMapFiles([scan])).toBe('done');
    expect(fitted).toEqual([]);
    expect(autoRead).toHaveBeenCalledWith('m1');
  });

  it('a georeference in an unknown system asks for it; the task ends either way', async () => {
    importResult = 'crs';
    expect(await addOwnMapFiles([scan])).toBe('needCrs');
    expect(seen).toHaveLength(1);
    expect(useActivityStore.getState().tasks).toEqual([]);
    expect(useOwnMapsStore.getState().importing).toBeNull();
  });
});
