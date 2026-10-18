import type { Candidate } from '@/shared/types/domain';
import {
  ARCHIVAL_REASON,
  archivalNearest,
  archivalReason,
  type ArchivalFeature,
} from './archivalContext';
import type { XY } from './features/lines';
import { interpretConfig } from './interpretConfig';
import { contextPriority, contextScore, weighScore } from './score';

export const CONTEXT_BUMP_REASON = 'silny kontekst historyczny podnosi priorytet';

/**
 * A stored candidate re-scored against the current archival objects (all in the same planar
 * metres as `at`): context, score, priority and the archival reasons. Null when the candidate
 * comes from an analysis older than `contextInputs` and cannot be re-scored.
 */
export function rescoreContext(
  c: Candidate,
  at: XY,
  features: readonly ArchivalFeature[],
  weights: { relief: number; confidence: number; context: number },
  cfg = interpretConfig,
): Candidate | null {
  if (!c.scoreParts || !c.contextInputs) return null;
  const { roadM, waterM, basePriority } = c.contextInputs;
  const nearest = archivalNearest(at, features, cfg);
  const ctx = contextScore(
    c.interpretation,
    {
      archivalM: nearest.distM,
      archivalRadiusM: nearest.radiusM,
      roadM: roadM ?? Infinity,
      waterM: waterM ?? Infinity,
    },
    cfg,
  );
  const reasons = c.reasons.filter((r) => !ARCHIVAL_REASON.test(r) && r !== CONTEXT_BUMP_REASON);
  const archival = archivalReason(nearest);
  if (archival) reasons.push(archival);
  // a forbidden zone or a natural form wins over context
  let priority = c.priority;
  if (priority !== 'chroniony' && priority !== 'naturalne') {
    priority = contextPriority(basePriority, ctx, cfg);
    if (priority !== basePriority) reasons.push(CONTEXT_BUMP_REASON);
  }
  const context = Math.round(ctx * 1000) / 1000;
  return {
    ...c,
    scoreParts: { ...c.scoreParts, context },
    score: weighScore({ ...c.scoreParts, context }, weights),
    priority,
    reasons,
  };
}
