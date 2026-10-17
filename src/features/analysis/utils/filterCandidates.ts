import type { Candidate } from '@/shared/types/domain';
import type { CandidateFilters } from '../config/filters';

/** Candidates passing the filters, best score first. */
export function filterCandidates(
  candidates: readonly Candidate[],
  f: CandidateFilters,
): Candidate[] {
  return candidates
    .filter(
      (c) =>
        c.score >= f.minScore &&
        (f.forms.length === 0 || f.forms.includes(c.form)) &&
        (f.showProtected || !c.protectedLikely) &&
        (f.showRejected || c.decision !== 'odrzucony'),
    )
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}
