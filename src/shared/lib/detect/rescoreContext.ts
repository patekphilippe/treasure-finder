import type { Candidate } from '@/shared/types/domain';
import {
  ARCHIVAL_REASON,
  archivalNearest,
  archivalReason,
  type ArchivalFeature,
} from './archivalContext';
import type { XY } from './features/lines';
import { interpretConfig } from './interpretConfig';
import {
  GRAVE_PROTECT_SUFFIX,
  MILITARY_REASON,
  militaryNearby,
  withMilitaryFlags,
} from './militaryNearby';
import { contextPriority, contextScore, weighScore } from './score';
import { FLAGS } from './vocabulary';

export const CONTEXT_BUMP_REASON = 'silny kontekst historyczny podnosi priorytet';
export const FORBIDDEN_ZONE_REASON =
  'leży w strefie zakazu (prawdopodobne stanowisko), nie może być celem';

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
  const reasons = c.reasons.filter(
    (r) => !ARCHIVAL_REASON.test(r) && r !== CONTEXT_BUMP_REASON && !MILITARY_REASON.test(r),
  );
  const archival = archivalReason(nearest);
  if (archival) reasons.push(archival);
  // protection and natural forms win over context; only protection that demonstrably came
  // from a war grave on a map is decided again (the grave may have been removed). Protection
  // of any other or unknown origin (imports, older versions) always stays.
  const byGraveOnly =
    c.reasons.some((r) => MILITARY_REASON.test(r) && r.endsWith(GRAVE_PROTECT_SUFFIX)) &&
    basePriority !== 'chroniony' &&
    !c.reasons.includes(FORBIDDEN_ZONE_REASON);
  let priority = c.priority;
  if (priority === 'naturalne' || (priority === 'chroniony' && !byGraveOnly)) {
    // unchanged
  } else {
    priority = contextPriority(basePriority, ctx, cfg);
    if (priority !== basePriority) reasons.push(CONTEXT_BUMP_REASON);
  }
  const military = militaryNearby(at, features, cfg);
  reasons.push(...military.reasons);
  if (military.protect && priority !== 'naturalne') priority = 'chroniony';
  const context = Math.round(ctx * 1000) / 1000;
  return {
    ...c,
    scoreParts: { ...c.scoreParts, context },
    score: weighScore({ ...c.scoreParts, context }, weights),
    priority,
    flags: withMilitaryFlags(FLAGS[c.interpretation], military),
    reasons,
  };
}
