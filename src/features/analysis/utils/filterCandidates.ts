import { PRIORITIES } from '@/shared/lib/detect';
import type { Candidate } from '@/shared/types/domain';
import type { CandidateFilters } from '../config/filters';

/** Candidates passing the filters: highest priority first, then best score. */
export function filterCandidates(
  candidates: readonly Candidate[],
  f: CandidateFilters,
): Candidate[] {
  return candidates
    .filter(
      (c) =>
        c.score >= f.minScore &&
        (f.interpretations.length === 0 || f.interpretations.includes(c.interpretation)) &&
        (f.priorities.length === 0 || f.priorities.includes(c.priority)) &&
        (f.showProtected || c.priority !== 'chroniony') &&
        (f.showNatural || c.priority !== 'naturalne') &&
        (f.showRejected || c.decision !== 'odrzucony'),
    )
    .sort(
      (a, b) =>
        PRIORITIES[b.priority].rank - PRIORITIES[a.priority].rank ||
        b.score - a.score ||
        a.id.localeCompare(b.id),
    );
}
