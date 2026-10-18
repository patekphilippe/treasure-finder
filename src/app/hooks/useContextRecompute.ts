import { useEffect } from 'react';
import { recomputeContext } from '@/features/analysis/field';
import { useContextStore } from '@/features/history';

/**
 * Archival objects added, removed or imported re-score the NMT candidates at once. Wired here
 * so `history` and `analysis` stay independent of each other.
 */
export function useContextRecompute(): void {
  useEffect(
    () =>
      useContextStore.subscribe((s, prev) => {
        if (s.features !== prev.features) void recomputeContext(s.features);
      }),
    [],
  );
}
