import { candidatesRepo } from '@/shared/db';
import { rescoreContext } from '@/shared/lib/detect';
import { geometryTo2180, toEpsg2180 } from '@/shared/lib/geo';
import { contextYears } from '@/shared/lib/history';
import { isDisputed } from '@/shared/types/community';
import type { Candidate, ContextFeature } from '@/shared/types/domain';
import { useAnalysisSettings } from '../store/useAnalysisSettings';
import { useAnalysisStore } from '../store/useAnalysisStore';

/**
 * Re-scores the stored candidates after archival objects were added or removed, so a new object
 * raises nearby candidates at once. Returns how many candidates changed.
 */
export async function recomputeContext(features: readonly ContextFeature[]): Promise<number> {
  // objects the community disputes do not raise anything
  const local = features
    .filter((f) => !(f.community && isDisputed(f.community)))
    .map((f) => ({
      geometry: geometryTo2180(f.geometry),
      kind: f.kind,
      years: contextYears(f) ?? undefined,
    }));
  const weights = useAnalysisSettings.getState().weights;
  const changed: Candidate[] = [];
  for (const c of useAnalysisStore.getState().candidates) {
    const next = rescoreContext(c, toEpsg2180(c.lat, c.lng), local, weights);
    if (
      next &&
      (next.score !== c.score ||
        next.priority !== c.priority ||
        next.reasons.join('|') !== c.reasons.join('|'))
    )
      changed.push(next);
  }
  if (changed.length) {
    await candidatesRepo.putMany(changed);
    await useAnalysisStore.getState().load();
  }
  return changed.length;
}
