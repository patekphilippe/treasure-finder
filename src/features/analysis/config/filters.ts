import type { FormClass } from '@/shared/types/domain';

export interface CandidateFilters {
  minScore: number;
  /** empty = all classes */
  forms: FormClass[];
  showProtected: boolean;
  showRejected: boolean;
}

export const DEFAULT_FILTERS: CandidateFilters = {
  minScore: 50,
  forms: [],
  showProtected: true,
  showRejected: false,
};

/** Rendering more rows than this makes the list sluggish; the map still shows all. */
export const LIST_LIMIT = 200;
