import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContextFeature, OwnMap, Sighting } from '@/shared/types/domain';
import { makeOwnMap } from '../../helpers/fixtures';

const removedRemote: string[][] = [];
let remoteFails = false;
const reads: string[] = [];
vi.mock('@/features/history/services/communityApi', () => ({
  communityApi: {
    removeMany: async (ids: string[]) => {
      if (remoteFails) throw new Error('Dzienny limit zmian');
      removedRemote.push(ids);
      return { removed: ids.length };
    },
  },
}));
const removedMaps: string[] = [];
vi.mock('@/features/history/services/sharedMapsApi', () => ({
  sharedMapsApi: { remove: async (id: string) => void removedMaps.push(id) },
}));
vi.mock('@/features/history/services/autoReadMap', () => ({
  autoReadMap: async (id: string) => void reads.push(id),
}));

const { rereadOwnMap } = await import('@/features/history/services/rereadOwnMap');
const { removeOwnMap } = await import('@/features/history/services/removeOwnMap');
const { orphanObjects } = await import('@/features/history/utils/orphanObjects');
const { profileForMap } = await import('@/features/history/utils/profileForMap');
const { useContextStore } = await import('@/features/history/store/useContextStore');
const { useOwnMapsStore } = await import('@/features/history/store/useOwnMapsStore');
const { useMembership } = await import('@/shared/store/useMembership');

const on = (id: string): Sighting => ({ map: { kind: 'own', id, label: id }, how: 'ai' });
const feature = (id: string, seen: Sighting[], community?: Partial<ContextFeature['community']>) =>
  ({
    id,
    kind: 'inne',
    geometry: { type: 'Point', coordinates: [16, 51] },
    source: 'test',
    seen,
    ...(community && { community: { id: `c-${id}`, up: 0, down: 0, ...community } }),
  }) as ContextFeature;

describe('reading a map again', () => {
  let maps: OwnMap[];
  let features: ContextFeature[];
  beforeEach(() => {
    removedRemote.length = 0;
    removedMaps.length = 0;
    reads.length = 0;
    remoteFails = false;
    maps = [makeOwnMap({ readAt: 5 })];
    features = [
      feature('pin', [on('m1')]),
      feature('mine', [on('m1')], { mineAuthor: true }),
      feature('theirs', [on('m1')], { mineAuthor: false }),
      feature('both', [on('m1'), on('m2')]),
      feature('other', [on('m2')]),
    ];
    useMembership.setState({ email: 'anna@example.com', name: 'Anna', owner: false });
    useOwnMapsStore.setState({
      maps,
      add: async (m) => void useOwnMapsStore.setState({ maps: [m] }),
      remove: async (id) =>
        void useOwnMapsStore.setState((s) => ({ maps: s.maps.filter((m) => m.id !== id) })),
    });
    useContextStore.setState({
      features,
      remove: async (id) =>
        void useContextStore.setState((s) => ({ features: s.features.filter((f) => f.id !== id) })),
    });
  });

  it('throws away what only this map saw (own shared copies too) and reads it again', async () => {
    expect(await rereadOwnMap('m1')).toBe(2);
    expect(removedRemote).toEqual([['c-mine']]);
    expect(useContextStore.getState().features.map((f) => f.id)).toEqual([
      'theirs',
      'both',
      'other',
    ]);
    expect(useOwnMapsStore.getState().maps[0]!.readAt).toBeUndefined();
    expect(reads).toEqual(['m1']);
  });

  it('the shared base refuses: nothing changes here either', async () => {
    remoteFails = true;
    expect(await rereadOwnMap('m1')).toBe(0);
    expect(useContextStore.getState().features).toHaveLength(5);
    expect(reads).toEqual([]);
  });

  it('a scan as coarse as a 1:100 000 sheet is read with the sheet profile', () => {
    const fine = makeOwnMap(); // 2 m a pixel
    const coarse = makeOwnMap({ pixelToSource: [8, 0, 300000, 0, -8, 400000, 0, 0, 1] });
    expect(profileForMap(fine, 'topo')).toBe('topo');
    expect(profileForMap(coarse, 'topo')).toBe('arkusz100');
    expect(profileForMap(coarse, 'wojskowa')).toBe('wojskowa');
  });

  it('removing a map takes its objects along; when the shared base refuses, the map stays', async () => {
    useOwnMapsStore.setState({
      maps: [makeOwnMap({ shared: { mine: true, author: 'Anna', updatedAt: 1 } })],
    });
    remoteFails = true;
    await removeOwnMap('m1');
    expect(useOwnMapsStore.getState().maps).toHaveLength(1);
    remoteFails = false;
    await removeOwnMap('m1');
    expect(useOwnMapsStore.getState().maps).toEqual([]);
    expect(removedMaps).toEqual(['m1']);
    expect(useContextStore.getState().features.map((f) => f.id)).toEqual([
      'theirs',
      'both',
      'other',
    ]);
  });

  it('objects left by maps removed earlier are found; hand-marked and legacy ones are not', () => {
    const left = orphanObjects(
      [...features, { ...feature('legacy', []), seen: undefined } as ContextFeature],
      new Set(['m2']),
    );
    expect(left.map((f) => f.id)).toEqual(['pin', 'mine', 'theirs']);
  });
});
