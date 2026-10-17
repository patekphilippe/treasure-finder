import { describe, expect, it } from 'vitest';
import { fromEpsg2180, toEpsg2180 } from '@/shared/lib/geo';

describe('EPSG:2180', () => {
  it('maps the central meridian 19°E to false easting 500 000 m', () => {
    const [x] = toEpsg2180(52, 19);
    expect(x).toBeCloseTo(500_000, 3);
  });

  it('round-trips WGS84 → 2180 → WGS84 with sub-millimetre error', () => {
    const [x, y] = toEpsg2180(50.0647, 22.945);
    const [lat, lng] = fromEpsg2180(x, y);
    expect(lat).toBeCloseTo(50.0647, 8);
    expect(lng).toBeCloseTo(22.945, 8);
  });
});
