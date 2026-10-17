import { useMemo } from 'react';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { filterCandidates } from '../utils/filterCandidates';

export function useVisibleCandidates() {
  const candidates = useAnalysisStore((s) => s.candidates);
  const filters = useAnalysisStore((s) => s.filters);
  return useMemo(() => filterCandidates(candidates, filters), [candidates, filters]);
}
