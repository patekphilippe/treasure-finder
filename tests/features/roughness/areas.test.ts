import { describe, expect, it } from 'vitest';
import { mergeAreas } from '@/features/roughness/utils/mergeAreas';
import { suggestCategory } from '@/features/roughness/utils/suggestCategory';
import { describeShape } from '@/features/roughness/utils/describeShape';
import type { RoughArea } from '@/shared/types/domain';

const hotspot = (lat: number, lng: number, extra = {}) => ({
  lat,
  lng,
  areaM2: 4000,
  strength: 70,
  elongation: 1.4,
  ...extra,
});
let n = 0;
const id = () => `a${++n}`;

describe('suggestCategory', () => {
  it('recognises linear, single and clustered places from the shape', () => {
    expect(suggestCategory(5000, 4.2)).toBe('liniowe');
    expect(suggestCategory(600, 1.3)).toBe('pojedyncze');
    expect(suggestCategory(6000, 1.5)).toBe('skupisko');
  });
});

describe('mergeAreas', () => {
  it('numbers new places and suggests their category', () => {
    const out = mergeAreas(
      [],
      [hotspot(51.3, 16.12), hotspot(51.31, 16.13, { elongation: 5 })],
      1,
      id,
    );
    expect(out.map((a) => [a.no, a.category, a.auto])).toEqual([
      [1, 'skupisko', true],
      [2, 'liniowe', true],
    ]);
  });

  it('keeps the user category, number and note when the place is found again', () => {
    const mine: RoughArea = {
      ...mergeAreas([], [hotspot(51.3, 16.12)], 1, id)[0]!,
      category: 'wyrobisko',
      auto: false,
      note: 'stara żwirownia',
    };
    // 20 m away and now looking linear: still the same place, category stays
    const again = mergeAreas(
      [mine],
      [hotspot(51.30018, 16.12, { elongation: 6, strength: 80 })],
      2,
      id,
    );
    expect(again).toHaveLength(1);
    expect(again[0]).toMatchObject({
      id: mine.id,
      no: 1,
      category: 'wyrobisko',
      note: 'stara żwirownia',
      strength: 80,
    });
  });

  it('re-suggests the category of places the user has not categorised', () => {
    const auto = mergeAreas([], [hotspot(51.3, 16.12)], 1, id)[0]!;
    expect(mergeAreas([auto], [hotspot(51.3, 16.12, { elongation: 6 })], 2, id)[0]!.category).toBe(
      'liniowe',
    );
  });

  it('continues numbering after the highest existing number', () => {
    const first = mergeAreas([], [hotspot(51.3, 16.12)], 1, id);
    const out = mergeAreas(first, [hotspot(51.4, 16.2)], 2, id);
    expect(out[0]!.no).toBe(2);
  });
});

describe('describeShape', () => {
  it('describes size, shape and intensity without long dashes', () => {
    const text = describeShape({ areaM2: 4200, elongation: 4.4, strength: 78 });
    expect(text).toBe('0,42 ha, wydłużone 4:1, nasilenie 78%');
    expect(text).not.toMatch(/[—–]/);
  });
});
