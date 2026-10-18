import { describe, expect, it } from 'vitest';
import { analyseSheet, contextPriority, contextScore, score } from '@/shared/lib/detect';
import { fromEpsg2180 } from '@/shared/lib/geo';
import { scenarios } from '../../helpers/scenarios';
import { ORIGIN_E, ORIGIN_N } from '../../helpers/terrain';

const far = { archivalM: Infinity, roadM: Infinity, waterM: Infinity };

describe('context and score', () => {
  it('archival feature: 1 at 0 m, linear to 0 at 300 m', () => {
    expect(contextScore('okop', { ...far, archivalM: 0 })).toBe(1);
    expect(contextScore('okop', { ...far, archivalM: 150 })).toBeCloseTo(0.5);
    expect(contextScore('okop', { ...far, archivalM: 400 })).toBe(0);
  });

  it('bonuses: road within 100 m for everyone, water within 200 m for camps and dugouts; capped at 1', () => {
    expect(contextScore('okop', { ...far, roadM: 80 })).toBeCloseTo(0.2);
    expect(contextScore('ziemianka', { ...far, waterM: 150 })).toBeCloseTo(0.2);
    expect(contextScore('okop', { ...far, waterM: 150 })).toBe(0);
    expect(contextScore('oboz', { archivalM: 0, roadM: 0, waterM: 0 })).toBe(1);
  });

  it('score = 40 × relief + 20 × confidence + 40 × context', () => {
    expect(score(-0.5, 0.8, 0.25)).toBe(Math.round(40 * 0.5 + 20 * 0.8 + 40 * 0.25));
    expect(score(2, 1, 1)).toBe(100);
  });

  it('context ≥ 0.6 raises the priority one step, never for protected or natural', () => {
    expect(contextPriority('niski', 0.6)).toBe('sredni');
    expect(contextPriority('najwyzszy', 0.9)).toBe('najwyzszy');
    expect(contextPriority('chroniony', 1)).toBe('chroniony');
    expect(contextPriority('naturalne', 1)).toBe('naturalne');
    expect(contextPriority('niski', 0.59)).toBe('niski');
  });
});

describe('analyseSheet', () => {
  it('a dugout next to an archival settlement becomes top priority; zone in WGS84', () => {
    const [lat, lng] = fromEpsg2180(ORIGIN_E + 100.5, ORIGIN_N - 100.5);
    const cs = analyseSheet(scenarios.ziemianka().grid(), {
      sheetId: 'TEST',
      context: [{ type: 'Point', coordinates: [lng, lat] }],
    });
    const c = cs.find((x) => x.interpretation === 'ziemianka')!;
    expect(c.priority).toBe('najwyzszy');
    expect(c.reasons.join(' ')).toMatch(/mapy archiwalnej/);
    expect(c.score).toBeGreaterThanOrEqual(80);
    expect(c.searchZone?.type).toMatch(/Polygon/);
    expect(c.id).toMatch(/^TEST-\d{4}$/);
    expect(c.lat).toBeCloseTo(lat, 4);
  });

  it('a barrow keeps no search zone but gets an exclusion zone, even with context', () => {
    const [lat, lng] = fromEpsg2180(ORIGIN_E + 100, ORIGIN_N - 100);
    const c = analyseSheet(scenarios.kurhan().grid(), {
      sheetId: 'T',
      context: [{ type: 'Point', coordinates: [lng, lat] }],
    }).find((x) => x.interpretation === 'kurhan')!;
    expect(c.priority).toBe('chroniony');
    expect(c.searchZone).toBeNull();
    expect(c.exclusionZone?.type).toBe('Polygon');
  });

  it('reports progress', () => {
    const steps: string[] = [];
    analyseSheet(scenarios.lej().grid(), { sheetId: 'T', onProgress: (_, s) => steps.push(s) });
    expect(steps.at(-1)).toBe('Gotowe');
  });
});
