import { create } from 'zustand';
import { candidatesRepo } from '@/shared/db';
import type { Candidate } from '@/shared/types/domain';
import { DEFAULT_FILTERS, type CandidateFilters } from '../config/filters';

export interface RunState {
  /** file being analysed */
  name: string;
  share: number;
  step: string;
}

interface AnalysisState {
  candidates: Candidate[];
  selectedId: string | null;
  filters: CandidateFilters;
  run: RunState | null;
  load: () => Promise<void>;
  /** persist one changed candidate (decision, note) */
  update: (candidate: Candidate) => Promise<void>;
  select: (id: string | null) => void;
  setFilters: (filters: Partial<CandidateFilters>) => void;
  setRun: (run: RunState | null) => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  candidates: [],
  selectedId: null,
  filters: DEFAULT_FILTERS,
  run: null,
  load: async () => set({ candidates: await candidatesRepo.getAll() }),
  update: async (candidate) => {
    await candidatesRepo.put(candidate);
    set((s) => ({ candidates: s.candidates.map((c) => (c.id === candidate.id ? candidate : c)) }));
  },
  select: (selectedId) => set({ selectedId }),
  setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),
  setRun: (run) => set({ run }),
}));
