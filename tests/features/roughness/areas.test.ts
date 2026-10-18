import { describe, expect, it } from 'vitest';
import { describeShape } from '@/features/roughness/utils/describeShape';
import { mergeAreas } from '@/features/roughness/utils/mergeAreas';

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

describe('mergeAreas (uneven-ground places, no interpretation)', () => {
  it('numbers new places', () => {
    expect(
      mergeAreas([], [hotspot(51.3, 16.12), hotspot(51.31, 16.13)], 1, id).map((a) => a.no),
    ).toEqual([1, 2]);
  });

  it('keeps number and note when the place is found again', () => {
    const mine = { ...mergeAreas([], [hotspot(51.3, 16.12)], 1, id)[0]!, note: 'stara żwirownia' };
    const again = mergeAreas([mine], [hotspot(51.30018, 16.12, { strength: 80 })], 2, id);
    expect(again).toHaveLength(1);
    expect(again[0]).toMatchObject({ id: mine.id, no: 1, note: 'stara żwirownia', strength: 80 });
  });

  it('continues numbering after the highest existing number', () => {
    const first = mergeAreas([], [hotspot(51.3, 16.12)], 1, id);
    expect(mergeAreas(first, [hotspot(51.4, 16.2)], 2, id)[0]!.no).toBe(2);
  });
});

describe('describeShape', () => {
  it('describes size, shape and intensity without long dashes', () => {
    const text = describeShape({ areaM2: 4200, elongation: 4.4, strength: 78 });
    expect(text).toBe('0,42 ha, wydłużone 4:1, nasilenie 78%');
    expect(text).not.toMatch(/[—–]/);
  });
});
