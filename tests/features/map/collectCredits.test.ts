import { describe, expect, it } from 'vitest';
import { collectCredits } from '@/features/map/utils/collectCredits';

const layer = (attribution: string | null) => ({ getAttribution: () => attribution });

describe('collectCredits', () => {
  it('lists each credit of the layers on the map once, markers without one skipped', () => {
    const layers = [
      layer('© OSM'),
      layer(null),
      { getAttribution: undefined },
      layer('© GUGiK'),
      layer('© OSM'),
    ];
    const map = { eachLayer: (fn: (l: never) => void) => layers.forEach((l) => fn(l as never)) };
    expect(collectCredits(map as never)).toEqual(['© OSM', '© GUGiK']);
  });
});
