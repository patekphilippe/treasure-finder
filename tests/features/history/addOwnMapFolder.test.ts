import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OwnMap } from '@/shared/types/domain';

const events: string[] = [];
let placeFails: (name: string) => boolean = () => false;
const hints: unknown[] = [];

vi.mock('@/features/history/services/autoReadMap', () => ({
  autoReadMap: async (id: string) => void events.push(`read ${id}`),
}));
vi.mock('@/features/history/services/shareMap', () => ({ shareMap: async () => {} }));
vi.mock('@/features/history/services/placeScanWithAi', () => ({
  placeScanWithAi: async (scan: File, hint: unknown) => {
    events.push(`place ${scan.name}`);
    hints.push(hint);
    if (placeFails(scan.name)) throw new Error('limit dzienny');
    return { placed: { corners: [{ lat: 1, lng: 1 }] }, note: '' };
  },
}));
vi.mock('@/features/history/services/importOwnMap', () => ({
  importOwnMap: async (files: File[], opts: { sheet?: unknown; corners?: unknown }) => {
    const name = files[0]!.name.replace(/\.[^.]+$/, '');
    if (!opts.sheet && !opts.corners) throw new Error('Przesuń mapę w okolicę skanu');
    events.push(`import ${name}${opts.corners ? '' : ' (arkusz)'}`);
    return { map: { id: name, name } as OwnMap, needsFit: true };
  },
}));

const { addOwnMapFolder } = await import('@/features/history/services/addOwnMapFolder');
const { useOwnMapsStore } = await import('@/features/history/store/useOwnMapsStore');
const { useMembership } = await import('@/shared/store/useMembership');
const { useActivityStore } = await import('@/shared/store/useActivityStore');
const { useToastStore } = await import('@/shared/ui/Toast/useToastStore');

const jpg = (name: string) => new File(['x'], name, { type: 'image/jpeg' });

describe('loading a folder of maps', () => {
  const added: string[] = [];
  beforeEach(() => {
    events.length = 0;
    hints.length = 0;
    added.length = 0;
    placeFails = () => false;
    useMembership.setState({ email: 'anna@example.com', name: 'Anna', owner: false });
    useActivityStore.setState({ tasks: [] });
    useOwnMapsStore.setState({
      maps: [{ id: 'old', name: 'P38_S36_WARSZAWA' } as OwnMap],
      importing: null,
      add: async (m) => void added.push(m.id),
    });
  });

  it('one map after another: placed, then read whole before the next', async () => {
    const r = await addOwnMapFolder([jpg('P50_S33_KRAKOW.jpg'), jpg('P39_S24_POZNAN.jpg')]);
    expect(events).toEqual([
      'place P39_S24_POZNAN.jpg',
      'import P39_S24_POZNAN',
      'read P39_S24_POZNAN',
      'place P50_S33_KRAKOW.jpg',
      'import P50_S33_KRAKOW',
      'read P50_S33_KRAKOW',
    ]);
    expect(r.added).toEqual(['P39_S24_POZNAN', 'P50_S33_KRAKOW']);
    // the sheet from the file name is the backend's hint where to look
    expect(hints[0]).toMatchObject({ north: 52.5, west: 16.833333333333332 });
    expect(useActivityStore.getState().tasks).toEqual([]);
    expect(useOwnMapsStore.getState().importing).toBeNull();
    expect(useToastStore.getState().message).toBe('Mapy z folderu: wczytane: 2');
  });

  it('placing fails: the sheet number puts it close, unread until the corners are checked', async () => {
    placeFails = (n) => n.startsWith('P39');
    const r = await addOwnMapFolder([jpg('P39_S24_POZNAN.jpg'), jpg('bez_numeru.jpg')]);
    placeFails = () => true;
    expect(r.toFit).toEqual(['P39_S24_POZNAN']);
    expect(events).not.toContain('read P39_S24_POZNAN');
    // sorted by name; the one without a number was placed by AI
    expect(added).toEqual(['bez_numeru', 'P39_S24_POZNAN']);
    const again = await addOwnMapFolder([jpg('Mapa bez numeru 2.jpg')]);
    expect(again.skipped).toEqual(['Mapa bez numeru 2']);
  });

  it('maps already loaded and images with a world file are left out', async () => {
    const r = await addOwnMapFolder([
      jpg('P38_S36_WARSZAWA.jpg'),
      jpg('P50_S33_KRAKOW.jpg'),
      new File(['0'], 'P50_S33_KRAKOW.jgw'),
    ]);
    expect(r).toEqual({ added: [], toFit: [], skipped: ['P50_S33_KRAKOW'], known: 1 });
    expect(events).toEqual([]);
  });

  it('without signing in: by the sheet number only, nothing sent', async () => {
    useMembership.setState({ email: null, name: null, owner: false });
    const r = await addOwnMapFolder([jpg('P39_S24_POZNAN.jpg')]);
    expect(events).toEqual(['import P39_S24_POZNAN (arkusz)']);
    expect(r.toFit).toEqual(['P39_S24_POZNAN']);
  });
});
