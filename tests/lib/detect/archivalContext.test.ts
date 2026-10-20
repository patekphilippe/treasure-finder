import { describe, expect, it } from 'vitest';
import {
  analyseSheet,
  ARCHIVAL_REASON,
  archivalNearest,
  archivalReason,
  CONTEXT_BUMP_REASON,
  interpretConfig,
  rescoreContext,
} from '@/shared/lib/detect';
import { fromEpsg2180, geometryTo2180, toEpsg2180 } from '@/shared/lib/geo';
import { ORIGIN_E, ORIGIN_N } from '../../helpers/terrain';
import { scenarios } from '../../helpers/scenarios';

const pt = (x: number, y: number) => ({ type: 'Point' as const, coordinates: [x, y] });
const W = interpretConfig.score.weights;

describe('archival objects by kind', () => {
  it('each kind has its own range: a village 350 m away beats a ford 180 m away', () => {
    const n = archivalNearest(
      [0, 0],
      [
        { geometry: pt(180, 0), kind: 'brod' },
        { geometry: pt(350, 0), kind: 'osada' },
      ],
    );
    expect(n.kind).toBe('osada');
    expect(n.radiusM).toBe(400);
    expect(archivalReason(n)).toBe('dawna osada z mapy archiwalnej 350 m dalej');
  });

  it('the reason names the years of the maps when known', () => {
    const n = archivalNearest([0, 0], [{ geometry: pt(120, 0), kind: 'mlyn', years: '1883–1942' }]);
    expect(archivalReason(n)).toBe('młyn z mapy 1883–1942, 120 m dalej');
    expect(archivalReason({ ...n, years: '1936' })).toBe('młyn z mapy 1936, 120 m dalej');
    for (const r of [
      'młyn z mapy 1883–1942, 120 m dalej',
      'młyn z mapy 1936, 120 m dalej',
      'młyn z mapy archiwalnej 120 m dalej',
    ])
      expect(ARCHIVAL_REASON.test(r)).toBe(true);
    expect(ARCHIVAL_REASON.test('pozycje wojskowe z mapy 1944: możliwe niewybuchy')).toBe(false);
  });

  it('out of range gives no reason; objects without a kind use the default 300 m', () => {
    expect(
      archivalReason(archivalNearest([0, 0], [{ geometry: pt(160, 0), kind: 'droga' }])),
    ).toBeNull();
    expect(archivalNearest([0, 0], [{ geometry: pt(10, 0) }]).radiusM).toBe(300);
  });
});

describe('re-scoring stored candidates when objects change', () => {
  const [lat, lng] = fromEpsg2180(ORIGIN_E + 100.5, ORIGIN_N - 100.5);
  const plain = analyseSheet(scenarios.ziemianka().grid(), { sheetId: 'T' }).find(
    (c) => c.interpretation === 'ziemianka',
  )!;
  const at = toEpsg2180(plain.lat, plain.lng);
  const mill = [{ geometry: geometryTo2180(pt(lng, lat)), kind: 'mlyn' as const }];

  it('a new object nearby raises score and priority with a reason, like a fresh analysis', () => {
    const fresh = analyseSheet(scenarios.ziemianka().grid(), {
      sheetId: 'T',
      context: [{ geometry: pt(lng, lat), kind: 'mlyn' }],
    }).find((c) => c.interpretation === 'ziemianka')!;
    const next = rescoreContext(plain, at, mill, W)!;
    expect(next.score).toBeGreaterThan(plain.score);
    expect(next.score).toBe(fresh.score);
    expect(next.priority).toBe(fresh.priority);
    expect(next.reasons).toContain(CONTEXT_BUMP_REASON);
    expect(next.reasons.join(' ')).toMatch(/młyn z mapy archiwalnej \d+ m dalej/);
  });

  it('removing the object brings the candidate back, without duplicate reasons', () => {
    const raised = rescoreContext(plain, at, mill, W)!;
    const back = rescoreContext(raised, at, [], W)!;
    expect(back.score).toBe(plain.score);
    expect(back.priority).toBe(plain.priority);
    expect(back.reasons).toEqual(plain.reasons);
  });

  it('the years of the maps reach the reason, the same in a fresh analysis and a re-score', () => {
    const dated = [{ ...mill[0]!, years: '1883–1942' }];
    const fresh = analyseSheet(scenarios.ziemianka().grid(), {
      sheetId: 'T',
      context: [{ geometry: pt(lng, lat), kind: 'mlyn', years: '1883–1942' }],
    }).find((c) => c.interpretation === 'ziemianka')!;
    const next = rescoreContext(plain, at, dated, W)!;
    expect(next.reasons).toEqual(fresh.reasons);
    expect(next.reasons.join(' ')).toMatch(/młyn z mapy 1883–1942, \d+ m dalej/);
    // a candidate with the older text gets the new one instead, not both
    const older = rescoreContext(plain, at, mill, W)!;
    const again = rescoreContext(older, at, dated, W)!;
    expect(again.reasons).toEqual(next.reasons);
    expect(again.reasons.filter((r) => ARCHIVAL_REASON.test(r))).toHaveLength(1);
  });

  it('protected forms stay protected; old candidates without inputs are skipped', () => {
    expect(rescoreContext({ ...plain, priority: 'chroniony' }, at, mill, W)!.priority).toBe(
      'chroniony',
    );
    expect(rescoreContext({ ...plain, contextInputs: undefined }, at, mill, W)).toBeNull();
  });
});
