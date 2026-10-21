import { PRIORITIES } from '@/shared/lib/detect';
import type { Candidate } from '@/shared/types/domain';
import { BEST_MIN_SCORE, type CandidateFilters } from '../config/filters';

/** worth going out for; what the user chose by hand (a priority, a kind, natural) is shown anyway */
const isBest = (c: Candidate, f: CandidateFilters) =>
  c.decision === 'przyjety' ||
  c.priority === 'chroniony' ||
  c.priority === 'naturalne' ||
  f.priorities.includes(c.priority) ||
  f.interpretations.includes(c.interpretation) ||
  c.score >= (BEST_MIN_SCORE[c.priority] ?? Infinity);

/** Candidates passing the filters: highest priority first, then best score. */
export function filterCandidates(
  candidates: readonly Candidate[],
  f: CandidateFilters,
): Candidate[] {
  return candidates
    .filter(
      (c) =>
        (!f.onlyBest || isBest(c, f)) &&
        c.score >= f.minScore &&
        (f.interpretations.length === 0 || f.interpretations.includes(c.interpretation)) &&
        (f.priorities.length === 0 || f.priorities.includes(c.priority)) &&
        (f.showProtected || c.priority !== 'chroniony') &&
        (f.showNatural || c.priority !== 'naturalne') &&
        (f.showUndetermined ||
          c.interpretation !== 'nieokreslona' ||
          f.interpretations.includes('nieokreslona')) &&
        (f.showRejected || c.decision !== 'odrzucony'),
    )
    .sort(
      (a, b) =>
        PRIORITIES[b.priority].rank - PRIORITIES[a.priority].rank ||
        b.score - a.score ||
        a.id.localeCompare(b.id),
    );
}
