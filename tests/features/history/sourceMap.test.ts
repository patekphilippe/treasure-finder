// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { useLayersStore } from '@/features/layers';
import { showSourceMap } from '@/features/history/services/showSourceMap';
import { useOwnMapsStore } from '@/features/history/store/useOwnMapsStore';
import { describeSighting } from '@/features/history/utils/describeSighting';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import type { OwnMap } from '@/shared/types/domain';
import { clearDb } from '../../helpers/clearDb';

const own = (id: string, visible: boolean): OwnMap => ({
  id,
  name: id,
  created: 0,
  image: new Blob(),
  width: 10,
  height: 10,
  pixelToSource: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  epsg: 2180,
  method: 'corners',
  visible,
  opacity: 0.8,
});

describe('a map an object was seen on', () => {
  it('names the map with its years and says how and when', () => {
    const at = Date.UTC(2026, 9, 20, 12);
    expect(
      describeSighting({
        map: { kind: 'wms', id: 'x', label: 'Messtischblatt (1883–1942)' },
        years: { from: 1883, to: 1942 },
        at,
        how: 'ai',
      }),
    ).toEqual({
      title: 'Messtischblatt (1883–1942)',
      detail: expect.stringMatching(/^odczyt AI, 20 paź 2026/),
    });
    expect(
      describeSighting({
        map: { kind: 'none', label: 'Źródło: Kronika' },
        years: { from: 1890, to: 1890 },
        how: 'zrodlo',
        confidence: 0.8,
      }),
    ).toEqual({ title: 'Źródło: Kronika (1890)', detail: 'analiza źródła, pewność 80%' });
    expect(
      describeSighting({ map: { kind: 'none', label: 'zaznaczone ręcznie' }, how: 'reczne' }),
    ).toEqual({ title: 'zaznaczone ręcznie', detail: '' });
  });
});

describe('showing the map an object was seen on', () => {
  beforeEach(async () => {
    await clearDb();
    useOwnMapsStore.setState({ maps: [own('a', true), own('b', false)] });
    useLayersStore.setState({ historicalId: null, historicalYear: 2004 });
    useMapViewStore.setState({ flyTarget: null });
  });

  it('an own map becomes the only visible one, and the map flies to the object', async () => {
    expect(await showSourceMap({ kind: 'own', id: 'b', label: 'b' }, { lat: 51, lng: 16 })).toBe(
      true,
    );
    expect(useOwnMapsStore.getState().maps.map((m) => [m.id, m.visible])).toEqual([
      ['a', false],
      ['b', true],
    ]);
    expect(useMapViewStore.getState().flyTarget).toMatchObject({ lat: 51, lng: 16, zoom: 16 });
  });

  it('an online map is chosen with its year, own maps are hidden', async () => {
    const ok = await showSourceMap(
      { kind: 'wms', id: 'orto-archiwalna', label: 'Ortofotomapa archiwalna 2009', time: 2009 },
      null,
    );
    expect(ok).toBe(true);
    expect(useLayersStore.getState()).toMatchObject({
      historicalId: 'orto-archiwalna',
      historicalYear: 2009,
    });
    expect(useOwnMapsStore.getState().maps.every((m) => !m.visible)).toBe(true);
    expect(useMapViewStore.getState().flyTarget).toBeNull();
  });

  it('a deleted map or no map: nothing changes', async () => {
    expect(await showSourceMap({ kind: 'own', id: 'gone', label: 'x' }, null)).toBe(false);
    expect(await showSourceMap({ kind: 'wms', id: 'gone', label: 'x' }, null)).toBe(false);
    expect(await showSourceMap({ kind: 'none', label: 'x' }, null)).toBe(false);
    expect(useOwnMapsStore.getState().maps.map((m) => m.visible)).toEqual([true, false]);
  });
});
