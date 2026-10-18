import { candidatesRepo } from '@/shared/db';
import { weighScore, type AnalysisSettings } from '@/shared/lib/detect';
import type { Candidate } from '@/shared/types/domain';
import { useAnalysisStore } from '../store/useAnalysisStore';

/**
 * Applies new score weights to the stored candidates at once and returns how many could not be
 * re-scored: candidates from analyses older than the stored score parts keep their score until
 * their sheet is analysed again.
 */
export async function rescoreCandidates(weights: AnalysisSettings['weights']): Promise<number> {
  const all = useAnalysisStore.getState().candidates;
  const changed: Candidate[] = [];
  let old = 0;
  for (const c of all) {
    if (!c.scoreParts) {
      old++;
      continue;
    }
    const score = weighScore(c.scoreParts, weights);
    if (score !== c.score) changed.push({ ...c, score });
  }
  if (changed.length) {
    await candidatesRepo.putMany(changed);
    await useAnalysisStore.getState().load();
  }
  return old;
}
