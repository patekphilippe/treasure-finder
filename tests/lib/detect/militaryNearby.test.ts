import { describe, expect, it } from 'vitest';
import {
  analyseSheet,
  archivalNearest,
  interpretConfig,
  rescoreContext,
} from '@/shared/lib/detect';
import { militaryNearby } from '@/shared/lib/detect/militaryNearby';
import { fromEpsg2180, geometryTo2180, toEpsg2180 } from '@/shared/lib/geo';
import { ORIGIN_E, ORIGIN_N } from '../../helpers/terrain';
import { scenarios } from '../../helpers/scenarios';

const pt = (x: number, y: number) => ({ type: 'Point' as const, coordinates: [x, y] });
const W = interpretConfig.score.weights;

describe('military objects from maps', () => {
  it('positions within 300 m warn of unexploded ordnance; further away nothing', () => {
    const near = militaryNearby([0, 0], [{ geometry: pt(200, 0), kind: 'wojsko' }]);
    expect(near).toMatchObject({ uxo: true, warGraves: false, protect: false });
    expect(near.reasons[0]).toMatch(/pozycje wojskowe z mapy wojskowej 200 m dalej/);
    expect(militaryNearby([0, 0], [{ geometry: pt(400, 0), kind: 'wojsko' }]).reasons).toEqual([]);
  });

  it('a war grave warns within 150 m and protects within 50 m, but never lends context', () => {
    const grave = (d: number) => [{ geometry: pt(d, 0), kind: 'grob_wojenny' as const }];
    expect(militaryNearby([0, 0], grave(100))).toMatchObject({
      uxo: true,
      warGraves: true,
      protect: false,
    });
    expect(militaryNearby([0, 0], grave(30)).protect).toBe(true);
    expect(archivalNearest([0, 0], grave(10)).distM).toBe(Infinity);
  });
});

describe('candidates near military objects', () => {
  const [lat, lng] = fromEpsg2180(ORIGIN_E + 100.5, ORIGIN_N - 100.5);
  const sheet = (context = [] as Parameters<typeof analyseSheet>[1]['context']) =>
    analyseSheet(scenarios.ziemianka().grid(), { sheetId: 'T', context }).find(
      (c) => c.interpretation === 'ziemianka',
    )!;
  const plain = sheet();
  const at = toEpsg2180(plain.lat, plain.lng);
  const here = (kind: 'wojsko' | 'grob_wojenny') => [
    { geometry: geometryTo2180(pt(lng, lat)), kind },
  ];

  it('a fresh analysis next to a grave from a map: protected, no search zone, war-graves flag', () => {
    const c = sheet([{ geometry: pt(lng, lat), kind: 'grob_wojenny' }]);
    expect(plain.priority).not.toBe('chroniony');
    expect(c.priority).toBe('chroniony');
    expect(c.searchZone).toBeNull();
    expect(c.flags).toEqual({ uxo: true, warGraves: true });
    expect(c.reasons.join(' ')).toMatch(/mogiła wojenna z mapy wojskowej \d+ m dalej, nie może/);
  });

  it('re-scoring adds the UXO warning by positions, and protection by a grave', () => {
    expect(plain.flags).toEqual({ uxo: false, warGraves: false });
    const byPositions = rescoreContext(plain, at, here('wojsko'), W)!;
    expect(byPositions.flags.uxo).toBe(true);
    expect(byPositions.priority).not.toBe('chroniony');
    const byGrave = rescoreContext(plain, at, here('grob_wojenny'), W)!;
    expect(byGrave.priority).toBe('chroniony');
    expect(byGrave.flags.warGraves).toBe(true);
  });

  it('removing the grave lifts the protection it gave, without leftover reasons', () => {
    const protectedByGrave = rescoreContext(plain, at, here('grob_wojenny'), W)!;
    const back = rescoreContext(protectedByGrave, at, [], W)!;
    expect(back.priority).toBe(plain.priority);
    expect(back.flags).toEqual(plain.flags);
    expect(back.reasons).toEqual(plain.reasons);
  });

  it('a protected form stays protected when the grave next to it goes away', () => {
    const barrow = analyseSheet(scenarios.kurhan().grid(), { sheetId: 'K' }).find(
      (c) => c.interpretation === 'kurhan',
    )!;
    const p = toEpsg2180(barrow.lat, barrow.lng);
    const grave = [
      { geometry: { type: 'Point' as const, coordinates: p }, kind: 'grob_wojenny' as const },
    ];
    const withGrave = rescoreContext(barrow, p, grave, W)!;
    expect(rescoreContext(withGrave, p, [], W)!.priority).toBe('chroniony');
  });
});
