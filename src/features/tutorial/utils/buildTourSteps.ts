import type { Step } from 'react-joyride';
import { useAnalysisStore, useReliefStore } from '@/features/analysis/field';
import { useOwnMapsStore } from '@/features/history';
import { useAreasStore, useRoughnessStore } from '@/features/roughness';
import { detectPlatform } from '@/shared/lib/pwa/detectPlatform';
import { isInstalled } from '@/shared/lib/pwa/isInstalled';
import { useMembership } from '@/shared/store/useMembership';
import { TOUR_STEPS } from '../config/tourSteps';
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
    wholeMap:
      useMembership.getState().code !== null &&
      useOwnMapsStore.getState().maps.some((m) => m.visible),
    platform: detectPlatform(),
    legend:
      (roughness.result !== null && roughness.visible) || (areas.visible && areas.areas.length > 0),
  });
}
