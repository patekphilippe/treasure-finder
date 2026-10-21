import { describe, expect, it } from 'vitest';
import { idsSeenInYears } from '@/features/history/utils/idsSeenInYears';
import { mapYears } from '@/features/history/utils/mapYears';
import { readResM } from '@/features/history/utils/readResM';
import { shownMaps } from '@/features/history/utils/shownMaps';
import type { ContextFeature } from '@/shared/types/domain';
import { makeOwnMap } from '../../helpers/fixtures';

const seenIn = (id: string, from?: number, to = from): ContextFeature => ({
  id,
  kind: 'mlyn',
  geometry: { type: 'Point', coordinates: [15.8, 50.8] },
  source: 'test',
  seen: [
    {
      map: { kind: 'own', id: 'm', label: 'mapa' },
      how: 'ai',
      ...(from !== undefined && { years: { from, to: to! } }),
    },
  ],
});

describe('maps by year', () => {
  const maps = [
    makeOwnMap({ id: 'a', year: 1921, visible: false }),
    makeOwnMap({ id: 'b', year: 1936, visible: true }),
    makeOwnMap({ id: 'c', year: 1921, visible: true }),
    makeOwnMap({ id: 'd', visible: true }),
  ];

  it('the slider stops at each year once, oldest first', () => {
    expect(mapYears(maps)).toEqual([1921, 1936]);
  });

  it('chosen years show their maps whatever their switch; none chosen: the switches', () => {
    expect(shownMaps(maps, [1921]).map((m) => m.id)).toEqual(['a', 'c']);
    expect(shownMaps(maps, [1921, 1936]).map((m) => m.id)).toEqual(['a', 'b', 'c']);
    expect(shownMaps(maps, null).map((m) => m.id)).toEqual(['b', 'c', 'd']);
  });

  it('objects read from maps of that year, a map’s span of years included', () => {
    const features = [seenIn('x', 1921), seenIn('y', 1936), seenIn('z', 1919, 1925), seenIn('w')];
    expect([...idsSeenInYears(features, [1921])].sort()).toEqual(['x', 'z']);
    expect([...idsSeenInYears(features, [1921, 1936])].sort()).toEqual(['x', 'y', 'z']);
  });
});

describe('readResM', () => {
  it('a fine scan at the profile’s 2 m, a coarse 1:100 000 sheet at its own resolution', () => {
    // 4000 px over 8 km (2 m/px at 2 px/m in PUWG 1992): the profile's finest
    expect(readResM(makeOwnMap({ width: 4000, height: 3000 }), 'topo')).toBeCloseTo(2, 6);
    // the same footprint from a 2000 px scan: 4 m per pixel
    const coarse = makeOwnMap({
      width: 2000,
      height: 1500,
      pixelToSource: [4, 0, 300000, 0, -4, 400000, 0, 0, 1],
    });
    expect(readResM(coarse, 'topo')).toBeCloseTo(4, 6);
  });
});
