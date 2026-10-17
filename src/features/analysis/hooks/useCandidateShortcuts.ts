import { useEffect } from 'react';
import type { Candidate } from '@/shared/types/domain';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { useCandidateActions } from './useCandidateActions';

/** J/K next/previous, A accept, R reject, N note — ignored while typing or in a dialog. */
export function useCandidateShortcuts(
  visible: readonly Candidate[],
  onNote: (c: Candidate) => void,
): void {
  const actions = useCandidateActions();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, [role="dialog"]')) return;
      const key = e.key.toLowerCase();
      if (!['j', 'k', 'a', 'r', 'n'].includes(key) || visible.length === 0) return;
      e.preventDefault();

      const { selectedId } = useAnalysisStore.getState();
      const index = visible.findIndex((c) => c.id === selectedId);
      const current = index >= 0 ? visible[index] : undefined;
      if (key === 'j' || key === 'k') {
        const next = index < 0 ? 0 : index + (key === 'j' ? 1 : -1);
        const c = visible[Math.max(0, Math.min(visible.length - 1, next))];
        if (c) actions.focus(c);
        return;
      }
      if (!current) return;
      if (key === 'a') void actions.accept(current);
      if (key === 'r') void actions.reject(current);
      if (key === 'n') onNote(current);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, actions, onNote]);
}
