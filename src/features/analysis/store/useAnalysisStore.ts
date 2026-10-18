import { create } from 'zustand';
import { candidatesRepo } from '@/shared/db';
import type { Candidate } from '@/shared/types/domain';
import { DEFAULT_FILTERS, type CandidateFilters } from '../config/filters';
import type { ExclusionResult } from '../workers/messages';

export interface RunState {
  /** file being analysed */
  name: string;
  share: number;
  step: string;
}

/** BDOT10k exclusion of the last analysed sheet (this session only) */
export interface SheetExclusion extends ExclusionResult {
  sheetId: string;
  /** EPSG:2180 of the top-left corner */
  originE: number;
  originN: number;
  /** metres per cell */
  res: number;
  w: number;
  h: number;
}

interface AnalysisState {
  candidates: Candidate[];
  selectedId: string | null;
  filters: CandidateFilters;
  run: RunState | null;
  exclusion: SheetExclusion | null;
  exclusionVisible: boolean;
  load: () => Promise<void>;
  /** persist one changed candidate (decision, note) */
  update: (candidate: Candidate) => Promise<void>;
  select: (id: string | null) => void;
  setFilters: (filters: Partial<CandidateFilters>) => void;
  setRun: (run: RunState | null) => void;
  setExclusion: (exclusion: SheetExclusion | null) => void;
  setExclusionVisible: (visible: boolean) => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  candidates: [],
  selectedId: null,
  filters: DEFAULT_FILTERS,
  run: null,
  exclusion: null,
  exclusionVisible: true,
  load: async () => set({ candidates: await candidatesRepo.getAll() }),
  update: async (candidate) => {
    await candidatesRepo.put(candidate);
    set((s) => ({ candidates: s.candidates.map((c) => (c.id === candidate.id ? candidate : c)) }));
  },
  select: (selectedId) => set({ selectedId }),
  setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),
  setRun: (run) => set({ run }),
  setExclusion: (exclusion) => set({ exclusion }),
  setExclusionVisible: (exclusionVisible) => set({ exclusionVisible }),
}));
