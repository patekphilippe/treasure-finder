import type { Polygon } from 'geojson';
import { describe, expect, it } from 'vitest';
import { updateMembership } from '@/features/zones/utils/updateMembership';
import { zoneAlert } from '@/features/zones/utils/zoneAlert';
import type { Zone } from '@/shared/types/domain';

// square 16.3–16.302 E, 51.2–51.202 N (~140 × 220 m); the western edge is at lng 16.3
const square: Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [16.3, 51.2],
      [16.302, 51.2],
      [16.302, 51.202],
      [16.3, 51.202],
      [16.3, 51.2],
    ],
  ],
};
const zone = (kind: Zone['kind'], extra: Partial<Zone> = {}): Zone => ({
  id: kind,
  name: kind,
  kind,
  geometry: square,
  ...extra,
});
const M_LNG = 1 / (111_320 * Math.cos((51.201 * Math.PI) / 180)); // degrees per metre east
const at = (metresEastOfEdge: number) => [51.201, 16.3 + metresEastOfEdge * M_LNG] as const;

describe('updateMembership (hysteresis)', () => {
  const zones = [zone('zakaz')];

  it('takes the first reading as is', () => {
    expect(updateMembership({}, ...at(2), 4, zones)).toEqual({ zakaz: true });
    expect(updateMembership({}, ...at(-2), 4, zones)).toEqual({ zakaz: false });
  });

  it('does not flicker while jittering around the border', () => {
    let m = updateMembership({}, ...at(-20), 4, zones);
    for (const x of [-3, 2, -1, 4, -4, 3, 6]) {
      m = updateMembership(m, ...at(x), 4, zones);
      expect(m.zakaz).toBe(false); // margin = 5 + 4/2 = 7 m
    }
    m = updateMembership(m, ...at(8), 4, zones);
    expect(m.zakaz).toBe(true);
    m = updateMembership(m, ...at(-6), 4, zones);
    expect(m.zakaz).toBe(true);
    m = updateMembership(m, ...at(-8), 4, zones);
    expect(m.zakaz).toBe(false);
  });

  it('widens the margin with poor GPS accuracy (capped)', () => {
    const outside = updateMembership({}, ...at(-30), 30, zones);
    expect(updateMembership(outside, ...at(12), 30, zones).zakaz).toBe(false); // 5 + 10 = 15 m
    expect(updateMembership(outside, ...at(16), 30, zones).zakaz).toBe(true);
  });
});

describe('zoneAlert', () => {
  const now = Date.UTC(2027, 5, 1);

  it('alerts inside a forbidden zone', () => {
    expect(zoneAlert({ zakaz: true }, [zone('zakaz')], now)).toMatchObject({ kind: 'zakaz' });
  });

  it('alerts outside all permit zones only when permit zones exist', () => {
    expect(zoneAlert({ zgoda: false }, [zone('zgoda')], now)).toEqual({ kind: 'poza_zgoda' });
    expect(zoneAlert({}, [], now)).toBeNull();
    expect(zoneAlert({ zgoda: true }, [zone('zgoda')], now)).toBeNull();
  });

  it('alerts inside an expired permit', () => {
    const expired = zone('zgoda', { validUntil: now - 1 });
    expect(zoneAlert({ zgoda: true }, [expired], now)).toMatchObject({ kind: 'zgoda_wygasla' });
  });
});
