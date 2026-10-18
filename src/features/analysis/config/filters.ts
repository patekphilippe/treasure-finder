import type { Interpretation, Priority } from '@/shared/types/domain';

export interface CandidateFilters {
  minScore: number;
  /** empty = all */
  interpretations: Interpretation[];
  /** empty = all */
  priorities: Priority[];
  showProtected: boolean;
  showNatural: boolean;
  showRejected: boolean;
}

export const DEFAULT_FILTERS: CandidateFilters = {
  minScore: 0,
  interpretations: [],
  priorities: [],
  showProtected: true,
  showNatural: false,
  showRejected: false,
};

/** Rendering more rows than this makes the list sluggish; the map still shows all. */
export const LIST_LIMIT = 200;
