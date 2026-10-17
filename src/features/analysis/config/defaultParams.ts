import type { AnalysisParams } from '@/shared/types/domain';

export const DEFAULT_ANALYSIS_PARAMS: AnalysisParams = {
  lrmRadiusM: 15,
  thresholdM: 0.25,
  minAreaM2: 4,
  maxAreaM2: 5000,
  weights: { relief: 40, shape: 25, context: 35 },
};
