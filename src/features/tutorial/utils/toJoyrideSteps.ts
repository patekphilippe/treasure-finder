import type { Step } from 'react-joyride';
import type { Platform, TourStep } from '../config/tourSteps';
import { showTourView } from './showTourView';

export interface TourConditions {
  candidates: boolean;
  legend: boolean;
  exclusion: boolean;
  installed: boolean;
  relief: boolean;
  platform: Platform;
}

const applies = (step: TourStep, c: TourConditions) => {
  if (step.when === 'candidates') return c.candidates;
  if (step.when === 'noCandidates') return !c.candidates;
  if (step.when === 'legend') return c.legend;
  if (step.when === 'exclusion') return c.exclusion;
  if (step.when === 'notInstalled') return !c.installed;
  if (step.when === 'relief') return c.relief;
  return true;
};

/** Tour steps for the current data, each preparing its own view before it shows. */
export function toJoyrideSteps(steps: readonly TourStep[], c: TourConditions): Step[] {
  return steps
    .filter((s) => applies(s, c))
    .map((s) => {
      const target = s.target ? `[data-tour="${s.target}"]` : 'body';
      return {
        id: s.id,
        target,
        // in a sheet the whole sheet stays lit and the section gets an outline (markTourTarget)
        ...(s.sheet && {
          spotlightTarget: '[data-tour="sheet"]',
          spotlightPadding: 0,
          spotlightRadius: 16,
        }),
        placement: s.target ? (s.placement ?? 'auto') : 'center',
        // tall targets (sheets, the analysis panel) leave no room above or below on a phone:
        // shift the card back into the viewport even if it then covers part of the target
        floatingOptions: { shiftOptions: { crossAxis: true, padding: 12 } },
        title: s.title,
        content: s.contentByPlatform?.[c.platform] ?? s.content,
        before: () => showTourView(s.mode, s.sheet ?? null, target),
      };
    });
}
