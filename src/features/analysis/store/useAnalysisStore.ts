import { create } from 'zustand';
import { candidatesRepo } from '@/shared/db';
import type { AnalysisParams, Candidate } from '@/shared/types/domain';
import { DEFAULT_ANALYSIS_PARAMS } from '../config/defaultParams';
import { DEFAULT_FILTERS, type CandidateFilters } from '../config/filters';

interface AnalysisState {
  params: AnalysisParams;
  candidates: Candidate[];
  selectedId: string | null;
  filters: CandidateFilters;
  setParams: (params: Partial<AnalysisParams>) => void;
  load: () => Promise<void>;
  /** persist one changed candidate (decision, note) */
  update: (candidate: Candidate) => Promise<void>;
  select: (id: string | null) => void;
  setFilters: (filters: Partial<CandidateFilters>) => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  params: DEFAULT_ANALYSIS_PARAMS,
  candidates: [],
  selectedId: null,
  filters: DEFAULT_FILTERS,
  setParams: (params) => set((s) => ({ params: { ...s.params, ...params } })),
  load: async () => set({ candidates: await candidatesRepo.getAll() }),
  update: async (candidate) => {
    await candidatesRepo.put(candidate);
    set((s) => ({ candidates: s.candidates.map((c) => (c.id === candidate.id ? candidate : c)) }));
  },
  select: (selectedId) => set({ selectedId }),
  setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),
}));
