import { create } from 'zustand';
import type { AnalysisParams, Candidate } from '@/shared/types/domain';
import { DEFAULT_ANALYSIS_PARAMS } from '../config/defaultParams';

interface AnalysisState {
  params: AnalysisParams;
  /** 0–100 while the worker runs, null when idle */
  progress: number | null;
  candidates: Candidate[];
  selectedId: string | null;
  setParams: (params: Partial<AnalysisParams>) => void;
  setProgress: (progress: number | null) => void;
  setCandidates: (candidates: Candidate[]) => void;
  select: (id: string | null) => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  params: DEFAULT_ANALYSIS_PARAMS,
  progress: null,
  candidates: [],
  selectedId: null,
  setParams: (params) => set((s) => ({ params: { ...s.params, ...params } })),
  setProgress: (progress) => set({ progress }),
  setCandidates: (candidates) => set({ candidates }),
  select: (selectedId) => set({ selectedId }),
}));
