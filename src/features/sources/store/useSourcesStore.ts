import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { SubmissionMode, SubmissionView } from '@/shared/types/sources';

export interface SentSource {
  id: string;
  /** only way to read or delete it on the server */
  accessKey: string;
  mode: SubmissionMode;
  label: string;
  sentAt: number;
  view: SubmissionView | null;
  /** indices of result objects already added to the archival context */
  accepted: number[];
  /** a result came that the user has not looked at yet */
  fresh?: boolean;
}

interface SourcesState {
  sent: SentSource[];
  /** analysis whose objects are drawn on the map */
  shownId: string | null;
  add: (s: SentSource) => void;
  update: (id: string, patch: Partial<SentSource>) => void;
  remove: (id: string) => void;
  show: (id: string | null) => void;
  /** the results were seen in "Moje źródła" */
  markSeen: () => void;
}

export const useSourcesStore = create<SourcesState>()(
  persist(
    (set) => ({
      sent: [],
      shownId: null,
      add: (s) => set((st) => ({ sent: [s, ...st.sent] })),
      update: (id, patch) =>
        set((st) => ({ sent: st.sent.map((s) => (s.id === id ? { ...s, ...patch } : s)) })),
      remove: (id) =>
        set((st) => ({
          sent: st.sent.filter((s) => s.id !== id),
          shownId: st.shownId === id ? null : st.shownId,
        })),
      show: (shownId) => set({ shownId }),
      markSeen: () =>
        set((st) =>
          st.sent.some((s) => s.fresh)
            ? { sent: st.sent.map((s) => (s.fresh ? { ...s, fresh: false } : s)) }
            : st,
        ),
    }),
    {
      name: 'mapa.sources',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ sent: s.sent }),
    },
  ),
);
