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
vi.mock('@/features/history/services/autoReadMap', () => ({
  autoReadMap: async (id: string) => void reads.push(id),
}));

const { rereadOwnMap } = await import('@/features/history/services/rereadOwnMap');
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
});
