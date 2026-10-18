import { describe, expect, it } from 'vitest';
import { detectForms } from '@/shared/lib/detect/pipeline';
import { buildScene } from '@/shared/lib/detect/scene';
import {
  areaCentroid,
  buildExclusionLocal,
  buildZoneLocal,
  toWgs84,
} from '@/shared/lib/detect/searchZone';
import { scenarios } from '../../helpers/scenarios';
import { ORIGIN_E, ORIGIN_N, type Terrain } from '../../helpers/terrain';

const detect = (t: Terrain, interp: string) => {
  const d = detectForms(buildScene(t.grid())).find((x) => x.interpretation === interp);
  if (!d) throw new Error(`no ${interp}`);
  return d;
};

describe('search zones (local metres: y north)', () => {
  it('3. firing positions: zone shifted to the side WITHOUT spoil (spoil north → zone south)', () => {
    const d = detect(scenarios.stanowiska(), 'stanowiska_strzeleckie');
    const z = areaCentroid(buildZoneLocal(d.zone));
    expect(z.c[1]).toBeLessThan(d.centre[1] - 2);
    // six 5 m circles, separate or touching: 6 × π × 25 ≈ 470 m²
    expect(z.area).toBeGreaterThan(300);
    expect(z.area).toBeLessThan(500);
  });

  it('4. trench: strip on the side WITHOUT the parapet (parapet north → zone south)', () => {
    const d = detect(scenarios.okop(), 'okop');
    expect(d.zone.kind).toBe('oneSide');
    const z = areaCentroid(buildZoneLocal(d.zone));
    expect(z.c[1]).toBeLessThan(d.centre[1] - 2);
  });

  it('10. horseshoe open to the south: zone reaches in front of the opening', () => {
    const d = detect(scenarios.podkowa(), 'stanowisko_sprzetu');
    const mp = buildZoneLocal(d.zone);
    const minY = Math.min(...mp.flatMap((p) => p[0]!.map((v) => v[1])));
    expect(minY).toBeLessThan(d.centre[1] - 12);
  });

  it('7. camp: hull + 30 m and a corridor to the water', () => {
    const d = detect(scenarios.oboz(), 'oboz');
    const mp = buildZoneLocal(d.zone);
    const maxX = Math.max(...mp.flatMap((p) => p[0]!.map((v) => v[0])));
    expect(maxX).toBeGreaterThan(160); // corridor reaches the valley at x ≈ 177
  });

  it('protected and natural forms have no search zone; barrows get an exclusion zone', () => {
    for (const [make, interp] of [
      [scenarios.kurhan, 'kurhan'],
      [scenarios.wykrot, 'wykrot'],
      [scenarios.melioracja, 'row_melioracyjny_graniczny'],
    ] as const) {
      const d = detect(make(), interp);
      expect(buildZoneLocal(d.zone)).toEqual([]);
    }
    const barrow = detect(scenarios.kurhan(), 'kurhan');
    const ex = areaCentroid(buildExclusionLocal(barrow.exclusion));
    // dome mask ~10 m across + 20 m: roughly π × 25² ≈ 2000 m²
    expect(ex.area).toBeGreaterThan(1300);
    expect(ex.area).toBeLessThan(2600);
  });

  it('crater: 5 m buffer around the pit; converts to closed WGS84 rings', () => {
    const d = detect(scenarios.lej(), 'leje');
    const g = toWgs84(buildZoneLocal(d.zone), ORIGIN_E, ORIGIN_N)!;
    expect(g.type).toBe('Polygon');
    const ring = (g as GeoJSON.Polygon).coordinates[0]!;
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    expect(ring.every(([lng, lat]) => Math.abs(lng!) <= 180 && Math.abs(lat!) <= 90)).toBe(true);
  });
});
