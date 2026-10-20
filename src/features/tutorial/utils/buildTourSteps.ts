import type { Step } from 'react-joyride';
import { useAnalysisStore, useReliefStore } from '@/features/analysis/field';
import { useOwnMapsStore } from '@/features/history';
import { useLayersStore } from '@/features/layers';
import { useAreasStore, useRoughnessStore } from '@/features/roughness';
import { detectPlatform } from '@/shared/lib/pwa/detectPlatform';
import { isInstalled } from '@/shared/lib/pwa/isInstalled';
import { useActivityStore } from '@/shared/store/useActivityStore';
import { useMembership } from '@/shared/store/useMembership';
import { TOUR_STEPS } from '../config/tourSteps';
import { toJoyrideSteps } from './toJoyrideSteps';

/** Steps for what the app shows right now (candidates loaded, legend on the map). */
export function buildTourSteps(): Step[] {
  const roughness = useRoughnessStore.getState();
  const areas = useAreasStore.getState();
  const analysis = useAnalysisStore.getState();
  const member = useMembership.getState().email !== null;
  const ownMapOn = useOwnMapsStore.getState().maps.some((m) => m.visible);
  return toJoyrideSteps(TOUR_STEPS, {
    candidates: analysis.candidates.length > 0,
    exclusion: analysis.exclusion !== null,
    installed: isInstalled(),
    relief: useReliefStore.getState().records.length > 0,
    wholeMap: member && ownMapOn,
    compare: member && (ownMapOn || useLayersStore.getState().historicalId !== null),
    activity: useActivityStore.getState().tasks.length > 0,
    mapYears:
      new Set(useOwnMapsStore.getState().maps.flatMap((m) => (m.year ? [m.year] : []))).size >= 2,
    platform: detectPlatform(),
    legend:
      (roughness.result !== null && roughness.visible) || (areas.visible && areas.areas.length > 0),
  });
}
