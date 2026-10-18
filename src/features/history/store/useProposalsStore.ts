import { create } from 'zustand';
import type { AiUsage } from '../services/readMapWithAi';
import type { Proposal } from '../services/findLostBuildings';

interface ProposalsState {
  proposals: Proposal[];
  /** what is happening now, or null */
  step: string | null;
  usage: AiUsage | null;
  /** objects the reading found (before comparing with today) */
  read: number | null;
  set: (patch: Partial<Pick<ProposalsState, 'proposals' | 'step' | 'usage' | 'read'>>) => void;
  drop: (id: string) => void;
}

export const useProposalsStore = create<ProposalsState>()((set, get) => ({
  proposals: [],
  step: null,
  usage: null,
  read: null,
  set: (patch) => set(patch),
  drop: (id) => set({ proposals: get().proposals.filter((p) => p.id !== id) }),
}));
