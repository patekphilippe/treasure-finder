import { useEffect } from 'react';
import { useAnalysisStore } from '../store/useAnalysisStore';

export function useLoadCandidates(): void {
  useEffect(() => {
    void useAnalysisStore.getState().load();
  }, []);
}
