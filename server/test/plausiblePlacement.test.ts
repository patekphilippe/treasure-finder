import { describe, expect, it } from 'vitest';
import { plausiblePlacement } from '../src/placements/plausiblePlacement';

describe('plausiblePlacement', () => {
  it('takes a sheet, refuses names matched across half of Europe', () => {
    // KdDR 301 Posen: 30′ × 15′, about 34 × 28 km
    const sheet = [
      { lat: 52.5, lng: 16.8333 },
      { lat: 52.5, lng: 17.3333 },
      { lat: 52.25, lng: 17.3333 },
      { lat: 52.25, lng: 16.8333 },
    ];
    expect(plausiblePlacement(sheet)).toBe(true);
    // the corners from the bad fit: Copenhagen, Gdańsk, Brest, Berlin
    expect(
      plausiblePlacement([
        { lat: 55.6, lng: 12.6 },
        { lat: 54.4, lng: 18.6 },
        { lat: 52.1, lng: 23.7 },
        { lat: 52.5, lng: 13.4 },
      ]),
    ).toBe(false);
    // crossed corners (a bow-tie) and a squashed one
    expect(plausiblePlacement([sheet[0]!, sheet[2]!, sheet[1]!, sheet[3]!])).toBe(false);
    expect(
      plausiblePlacement([sheet[0]!, sheet[1]!, { lat: 52.45, lng: 17.3333 }, sheet[3]!]),
    ).toBe(false);
  });
});
