import { describe, expect, it } from 'vitest';
import { readResM } from '@/features/history/utils/readResM';
import { oldMapGroups } from '@/features/history/utils/oldMapGroups';
import { oldMapGroupText } from '@/features/history/utils/oldMapGroupText';
import { pickedOldMap } from '@/features/history/utils/pickedOldMap';
import { makeOwnMap } from '../../helpers/fixtures';

describe('Stara mapa: one choice at a time', () => {
  const maps = [
    makeOwnMap({ id: 'a', year: 1921, visible: false }),
    makeOwnMap({ id: 'b', year: 1936, visible: true }),
    makeOwnMap({ id: 'c', year: 1921, visible: true }),
    makeOwnMap({ id: 'd', visible: true }),
  ];

  it('your maps as one tile per year, oldest first, those without a year last', () => {
    const groups = oldMapGroups([
      makeOwnMap({ id: 'd' }),
      makeOwnMap({ id: 'b', year: 1936, name: 'Lignica' }),
      makeOwnMap({ id: 'a', year: 1921, name: 'Złotoryja' }),
      makeOwnMap({ id: 'c', year: 1921, name: 'Chojnów' }),
    ]);
    expect(groups.map((g) => g.key)).toEqual(['1921', '1936', 'bez-roku']);
    expect(groups[0]!.maps.map((m) => m.id)).toEqual(['c', 'a']);
  });

  it('names a tile in plain words', () => {
    const one = oldMapGroups([makeOwnMap({ year: 1934, name: 'Lignica' })])[0]!;
    expect(oldMapGroupText(one)).toEqual({ title: 'Twoja mapa z 1934 r.', subtitle: 'Lignica' });
    const four = oldMapGroups(
      ['A', 'B', 'C', 'D'].map((name) => makeOwnMap({ id: name, name, year: 1934 })),
    )[0]!;
    expect(oldMapGroupText(four)).toEqual({
      title: 'Twoje mapy z 1934 r. (4)',
      subtitle: 'A, B i 2 inne',
    });
  });

  it('marks the tile matching what is on the map', () => {
    expect(pickedOldMap(maps, null)).toEqual({ none: false, ownKey: null, onlineId: null });
    const only1936 = maps.map((m) => ({ ...m, visible: m.year === 1936 }));
    expect(pickedOldMap(only1936, null).ownKey).toBe('1936');
    const off = maps.map((m) => ({ ...m, visible: false }));
    expect(pickedOldMap(off, null).none).toBe(true);
    expect(pickedOldMap(off, 'orto')).toEqual({ none: false, ownKey: null, onlineId: 'orto' });
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
