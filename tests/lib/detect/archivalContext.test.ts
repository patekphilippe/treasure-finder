import { describe, expect, it } from 'vitest';
import {
  analyseSheet,
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

  it('protected forms stay protected; old candidates without inputs are skipped', () => {
    expect(rescoreContext({ ...plain, priority: 'chroniony' }, at, mill, W)!.priority).toBe(
      'chroniony',
    );
    expect(rescoreContext({ ...plain, contextInputs: undefined }, at, mill, W)).toBeNull();
  });
});
