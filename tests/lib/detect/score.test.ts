import { describe, expect, it } from 'vitest';
import { analyseSheet, contextPriority, contextScore, score } from '@/shared/lib/detect';
import { fromEpsg2180, toEpsg2180 } from '@/shared/lib/geo';
import { scenarios } from '../../helpers/scenarios';
import { dome, ORIGIN_E, ORIGIN_N, rectPit, Terrain } from '../../helpers/terrain';

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

  it('a form in the exclusion zone of a barrow is protected too and has no search zone', () => {
    const grid = new Terrain()
      .add(dome(100, 100, 15, 1))
      .add(rectPit(118, 100, 5, 4, 1))
      .grid();
    const cs = analyseSheet(grid, { sheetId: 'T' });
    expect(cs.find((x) => x.interpretation === 'kurhan')?.priority).toBe('chroniony');
    const pit = cs.find((x) => x.interpretation !== 'kurhan' && Math.abs(x.reliefM) >= 0.5)!;
    expect(pit.priority).toBe('chroniony');
    expect(pit.searchZone).toBeNull();
    expect(pit.reasons.join(' ')).toMatch(/strefie zakazu/);
  });

  it("a 'zakaz' zone protects the forms in it and clips the search zones of the others", () => {
    const wgs = (x: number, y: number) => {
      const [lat, lng] = fromEpsg2180(ORIGIN_E + x, ORIGIN_N - y);
      return [lng, lat];
    };
    const box = (x0: number, y0: number, x1: number, y1: number) => ({
      type: 'Polygon' as const,
      coordinates: [[wgs(x0, y0), wgs(x1, y0), wgs(x1, y1), wgs(x0, y1), wgs(x0, y0)]],
    });
    const grid = scenarios.ziemianka().grid();
    const dugout = (forbidden: ReturnType<typeof box>[]) =>
      analyseSheet(grid, { sheetId: 'T', forbidden }).find((x) => x.interpretation === 'ziemianka');
    const inside = dugout([box(90, 90, 110, 110)])!;
    expect(inside.priority).toBe('chroniony');
    expect(inside.searchZone).toBeNull();

    // a zone 8–30 m west of the dugout: the dugout stays a target, its zone loses that part
    const free = dugout([])!;
    const clipped = dugout([box(70, 60, 92, 140)])!;
    expect(clipped.priority).toBe(free.priority);
    const xs = (g: typeof free.searchZone) =>
      (g!.type === 'Polygon' ? [g!.coordinates] : g!.coordinates)
        .flat(2)
        .map(([lng, lat]) => toEpsg2180(lat!, lng!)[0] - ORIGIN_E);
    expect(Math.min(...xs(free.searchZone))).toBeLessThan(85);
    expect(Math.min(...xs(clipped.searchZone))).toBeGreaterThan(91.9);
  });

  it('imported water near a dugout raises its score; water far outside the sheet is ignored', () => {
    const line = (x: number) => ({
      type: 'LineString' as const,
      coordinates: [0, 200].map((y) => {
        const [lat, lng] = fromEpsg2180(ORIGIN_E + x, ORIGIN_N - y);
        return [lng, lat];
      }),
    });
    const grid = scenarios.ziemianka().grid();
    const dugout = (water: ReturnType<typeof line>[]) =>
      analyseSheet(grid, { sheetId: 'T', water }).find((x) => x.interpretation === 'ziemianka')!;
    const dry = dugout([]);
    expect(dugout([line(160)]).score).toBe(dry.score + 8);
    expect(dugout([line(5000)]).score).toBe(dry.score);
  });

  it('reports progress', () => {
    const steps: string[] = [];
    analyseSheet(scenarios.lej().grid(), { sheetId: 'T', onProgress: (_, s) => steps.push(s) });
    expect(steps.at(-1)).toBe('Gotowe');
  });
});
