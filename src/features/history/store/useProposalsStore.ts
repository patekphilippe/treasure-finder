import { create } from 'zustand';
import { useActivityStore } from '@/shared/store/useActivityStore';
import type { AiUsage } from '../services/readMapWithAi';
import type { Proposal } from '../services/findLostBuildings';

interface ProposalsState {
  proposals: Proposal[];
  /** what is happening now, or null */
  step: string | null;
  /** 0–1 of a whole-map reading, null otherwise */
  share: number | null;
  usage: AiUsage | null;
  /** objects the reading found (before comparing with today) */
  read: number | null;
  /** a whole own map is being read window by window */
  wholeRunning: boolean;
  /** "Przerwij": no new windows, the ones in flight still finish */
  stopRequested: boolean;
  set: (
    patch: Partial<
      Pick<ProposalsState, 'proposals' | 'step' | 'share' | 'usage' | 'read' | 'wholeRunning'>
    >,
  ) => void;
  requestStop: () => void;
  drop: (id: string) => void;
}

/** The reading as a task on the activity chip, so it is seen with the sheet closed. */
function mirror(s: ProposalsState) {
  const activity = useActivityStore.getState();
  if (!s.step) return activity.end('ai');
  activity.upsert({
    id: 'ai',
    label: s.wholeRunning ? 'Odczyt całej mapy (AI)' : 'Odczyt mapy (AI)',
    short: 'Odczyt mapy',
    share: s.share,
    step: s.step,
    cancel: s.wholeRunning && !s.stopRequested ? s.requestStop : null,
    open: { mode: 'field', sheet: 'history' },
  });
}

export const useProposalsStore = create<ProposalsState>()((set, get) => ({
  proposals: [],
  step: null,
  share: null,
  usage: null,
  read: null,
  wholeRunning: false,
  stopRequested: false,
  set: (patch) => {
    set(patch.wholeRunning ? { ...patch, stopRequested: false } : patch);
    mirror(get());
  },
  requestStop: () => {
    set({ stopRequested: true, step: 'Przerywam po bieżących fragmentach' });
    mirror(get());
  },
  drop: (id) => set({ proposals: get().proposals.filter((p) => p.id !== id) }),
}));
