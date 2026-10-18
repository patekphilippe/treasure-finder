import type { Step } from 'react-joyride';
import { useAnalysisStore } from '@/features/analysis/field';
import { useAreasStore, useRoughnessStore } from '@/features/roughness';
import { TOUR_STEPS } from '../config/tourSteps';
import { toJoyrideSteps } from './toJoyrideSteps';

/** Steps for what the app shows right now (candidates loaded, legend on the map). */
export function buildTourSteps(): Step[] {
  const roughness = useRoughnessStore.getState();
  const areas = useAreasStore.getState();
  return toJoyrideSteps(TOUR_STEPS, {
    candidates: useAnalysisStore.getState().candidates.length > 0,
    legend:
      (roughness.result !== null && roughness.visible) || (areas.visible && areas.areas.length > 0),
  });
}
