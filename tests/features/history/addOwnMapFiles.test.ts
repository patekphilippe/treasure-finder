import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OwnMap } from '@/shared/types/domain';

const seen: { step: string | null; importing: string | null }[] = [];
let importResult: 'fit' | 'placed' | 'crs' = 'fit';
let placeFails = false;

const autoRead = vi.fn<(id: string) => Promise<void>>(async () => {});
// the background AI reading after placing (its own browser code stays out of this test)
vi.mock('@/features/history/services/autoReadMap', () => ({
  autoReadMap: (id: string) => autoRead(id),
}));
const focused: string[] = [];
const fitStarted: string[] = [];
// showing the map alone and corner dragging touch the map and the layers (browser code)
vi.mock('@/features/history/services/focusOwnMap', () => ({
  focusOwnMap: async (m: OwnMap) => void focused.push(m.id),
}));
vi.mock('@/features/history/services/startFitting', () => ({
  startFitting: async (id: string) => void fitStarted.push(id),
}));
vi.mock('@/features/history/services/shareMap', () => ({ shareMap: async () => {} }));
vi.mock('@/features/history/services/placeOwnMap', () => ({
  placeOwnMap: async () => {
    record();
    if (placeFails) throw new Error('Na mapie nie widać nazw ani numeru arkusza');
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
const { useToastStore } = await import('@/shared/ui/Toast/useToastStore');

function record() {
  seen.push({
    step: useActivityStore.getState().tasks.find((t) => t.id === 'own-map')?.step ?? null,
    importing: useOwnMapsStore.getState().importing,
  });
}

const scan = new File(['x'], 'wig.jpg', { type: 'image/jpeg' });

describe('adding an own map as a background task', () => {
  const added: OwnMap[] = [];
  beforeEach(() => {
    seen.length = 0;
    added.length = 0;
    focused.length = 0;
    fitStarted.length = 0;
    importResult = 'fit';
    placeFails = false;
    autoRead.mockClear();
    useActivityStore.setState({ tasks: [] });
    useToastStore.setState({ message: null, action: null });
    useOwnMapsStore.setState({ importing: null, add: async (m) => void added.push(m) });
  });

  it('placed by the AI: shown alone and read at once, the corners only offered', async () => {
    expect(await addOwnMapFiles([scan], { auto: true })).toBe('done');
    expect(seen).toEqual([
      { step: 'Umieszczam mapę po nazwach (AI)', importing: 'wig.jpg' },
      { step: 'Wczytuję obraz', importing: 'wig.jpg' },
    ]);
    expect(added[0]?.year).toBe(1921);
    expect(fitStarted).toEqual([]);
    expect(focused).toEqual(['m1']);
    await vi.waitFor(() => expect(autoRead).toHaveBeenCalledWith('m1'));
    const toast = useToastStore.getState();
    expect(toast.message).toMatch(/Umieszczono po nazwach: Kowary.*AI czyta mapę/);
    expect(toast.action?.label).toBe('Popraw narożniki');
    toast.action!.onClick();
    expect(fitStarted).toEqual(['m1']);
    expect(useActivityStore.getState().tasks).toEqual([]);
    expect(useOwnMapsStore.getState().importing).toBeNull();
  });

  it('the AI could not place it: corner dragging, read only after "Gotowe"', async () => {
    placeFails = true;
    expect(await addOwnMapFiles([scan], { auto: true })).toBe('done');
    expect(fitStarted).toEqual(['m1']);
    expect(focused).toEqual([]);
    expect(autoRead).not.toHaveBeenCalled();
    // the reason stays on screen, not hidden by the corners hint
    expect(useToastStore.getState().message).toBe(
      'AI nie umieściło mapy: Na mapie nie widać nazw ani numeru arkusza. Przeciągnij narożniki albo Anuluj.',
    );
  });

  it('a georeferenced map needs no fitting: Claude starts reading it at once', async () => {
    importResult = 'placed';
    expect(await addOwnMapFiles([scan])).toBe('done');
    expect(fitStarted).toEqual([]);
    await vi.waitFor(() => expect(autoRead).toHaveBeenCalledWith('m1'));
  });

  it('a georeference in an unknown system asks for it; the task ends either way', async () => {
    importResult = 'crs';
    expect(await addOwnMapFiles([scan])).toBe('needCrs');
    expect(seen).toHaveLength(1);
    expect(useActivityStore.getState().tasks).toEqual([]);
    expect(useOwnMapsStore.getState().importing).toBeNull();
  });
});
