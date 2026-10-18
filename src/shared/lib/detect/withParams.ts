import { interpretConfig, type InterpretConfig } from './interpretConfig';

/** What the user may change in the analysis settings (docs/PLAN.md, Etap 1). */
export interface AnalysisSettings {
  /** LRM smoothing radius, 5–30 m */
  lrmRadiusM: number;
  /** LRM threshold of the convex / concave masks, 0.10–0.80 m */
  thresholdM: number;
  /** score weights; any scale, the score normalises them to 0–100 */
  weights: { relief: number; confidence: number; context: number };
}

export const DEFAULT_SETTINGS: AnalysisSettings = {
  lrmRadiusM: interpretConfig.lrm.radiusM,
  thresholdM: interpretConfig.masks.thresholdM,
  weights: { ...interpretConfig.score.weights },
};

/**
 * The interpretation config with the user's settings. The config is typed by its literal
 * defaults; only numbers change here, so the cast keeps every consumer's reads valid.
 */
export function withParams(
  s: AnalysisSettings,
  cfg: InterpretConfig = interpretConfig,
): InterpretConfig {
  return {
    ...cfg,
    lrm: { ...cfg.lrm, radiusM: s.lrmRadiusM },
    masks: { ...cfg.masks, thresholdM: s.thresholdM },
    score: { ...cfg.score, weights: { ...s.weights } },
  } as unknown as InterpretConfig;
}
