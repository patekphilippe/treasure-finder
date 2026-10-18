import { describe, expect, it } from 'vitest';
import { normalizePoint, toSearchZonesGeoJSON } from '@/shared/lib/io';
import { candidatePointInput } from '@/features/analysis/utils/candidatePointInput';
import { makeCandidate } from '../../helpers/candidates';
import { makePoint } from '../../helpers/fixtures';

const zone = {
  type: 'Polygon' as const,
  coordinates: [
    [
      [16, 51],
      [16.001, 51],
      [16.001, 51.001],
      [16, 51],
    ],
  ],
};

describe('search zones export', () => {
  it('one polygon per candidate with a zone: id, interpretation, priority, flags', () => {
    const fc = toSearchZonesGeoJSON([
      makeCandidate({ id: 'a', interpretation: 'okop', priority: 'wysoki', searchZone: zone }),
      makeCandidate({ id: 'b', searchZone: null }),
    ]);
    expect(fc.features).toHaveLength(1);
    expect(fc.features[0]!.properties).toMatchObject({
      candidateId: 'a',
      interpretation: 'okop',
      nazwa: 'Okop',
      priority: 'wysoki',
      uxo: true,
    });
  });
});

describe('safety flags travel to the phone with the point', () => {
  it('accepted candidate → point with flags; backups keep them', () => {
    const p = candidatePointInput(makeCandidate({ flags: { uxo: true, warGraves: true } }));
    expect(p.flags).toEqual({ uxo: true, warGraves: true });
    const restored = normalizePoint(makePoint({ flags: { uxo: true, warGraves: false } }));
    expect(restored?.flags).toEqual({ uxo: true, warGraves: false });
    expect(normalizePoint(makePoint())?.flags).toBeUndefined();
  });
});
