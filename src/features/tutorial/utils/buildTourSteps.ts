import type { Step } from 'react-joyride';
import { useAnalysisStore, useReliefStore } from '@/features/analysis/field';
import { useAreasStore, useRoughnessStore } from '@/features/roughness';
import { TOUR_STEPS } from '../config/tourSteps';
import { detectPlatform } from './detectPlatform';
import { isInstalled } from './isInstalled';
import { toJoyrideSteps } from './toJoyrideSteps';

/** Steps for what the app shows right now (candidates loaded, legend on the map). */
export function buildTourSteps(): Step[] {
  const roughness = useRoughnessStore.getState();
  const areas = useAreasStore.getState();
  const analysis = useAnalysisStore.getState();
  return toJoyrideSteps(TOUR_STEPS, {
    candidates: analysis.candidates.length > 0,
    exclusion: analysis.exclusion !== null,
    installed: isInstalled(),
    relief: useReliefStore.getState().records.length > 0,
    platform: detectPlatform(),
    legend:
      (roughness.result !== null && roughness.visible) || (areas.visible && areas.areas.length > 0),
  });
}
