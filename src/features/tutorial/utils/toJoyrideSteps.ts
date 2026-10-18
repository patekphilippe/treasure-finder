import type { Step } from 'react-joyride';
import type { TourStep } from '../config/tourSteps';
import { showTourView } from './showTourView';

export interface TourConditions {
  candidates: boolean;
  legend: boolean;
  exclusion: boolean;
}

const applies = (step: TourStep, c: TourConditions) => {
  if (step.when === 'candidates') return c.candidates;
  if (step.when === 'noCandidates') return !c.candidates;
  if (step.when === 'legend') return c.legend;
  if (step.when === 'exclusion') return c.exclusion;
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
        placement: s.target ? (s.placement ?? 'auto') : 'center',
        title: s.title,
        content: s.content,
        before: () => showTourView(s.mode, s.sheet ?? null, target),
      };
    });
}
