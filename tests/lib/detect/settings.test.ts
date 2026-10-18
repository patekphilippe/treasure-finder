import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  interpretConfig,
  score,
  scoreParts,
  weighScore,
  withParams,
} from '@/shared/lib/detect';
import { buildScene } from '@/shared/lib/detect/scene';
import { scenarios } from '../../helpers/scenarios';

describe('analysis settings', () => {
  it('the defaults are the calibrated config', () => {
    const cfg = withParams(DEFAULT_SETTINGS);
    expect(cfg.lrm.radiusM).toBe(interpretConfig.lrm.radiusM);
    expect(cfg.masks.thresholdM).toBe(interpretConfig.masks.thresholdM);
    expect(cfg.score.weights).toEqual(interpretConfig.score.weights);
  });

  it('radius and threshold reach the scene; the rest of the config stays', () => {
    const cfg = withParams({ ...DEFAULT_SETTINGS, lrmRadiusM: 25, thresholdM: 0.6 });
    expect(cfg.lrm.radiusM).toBe(25);
    expect(cfg.masks.thresholdM).toBe(0.6);
    expect(cfg.masks.minAreaM2).toBe(interpretConfig.masks.minAreaM2);
    expect(cfg.sizes).toBe(interpretConfig.sizes);
  });

  it('a higher threshold leaves fewer cells in the concave mask', () => {
    const grid = scenarios.ziemianka().grid();
    const cells = (t: number) =>
      buildScene(
        grid,
        undefined,
        withParams({ ...DEFAULT_SETTINGS, thresholdM: t }),
      ).concave.reduce((n, v) => n + v, 0);
    expect(cells(0.1)).toBeGreaterThan(cells(0.8));
    expect(cells(0.8)).toBeGreaterThan(0);
  });
});

describe('score weights', () => {
  it('default weights give the same score as before (40 / 20 / 40 out of 100)', () => {
    const p = scoreParts(0.5, 0.7, 0.3);
    expect(weighScore(p, interpretConfig.score.weights)).toBe(score(0.5, 0.7, 0.3));
    expect(score(0.5, 0.7, 0.3)).toBe(Math.round(40 * 0.5 + 20 * 0.7 + 40 * 0.3));
  });

  it('weights are normalised: any scale gives 0–100, only context counts when alone', () => {
    const p = { relief: 1, confidence: 1, context: 0.25 };
    expect(weighScore(p, { relief: 0, confidence: 0, context: 7 })).toBe(25);
    expect(weighScore(p, { relief: 2, confidence: 1, context: 1 })).toBe(
      weighScore(p, { relief: 80, confidence: 40, context: 40 }),
    );
    expect(weighScore(p, { relief: 0, confidence: 0, context: 0 })).toBe(0);
  });
});
