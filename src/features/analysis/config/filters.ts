import type { Interpretation, Priority } from '@/shared/types/domain';

export interface CandidateFilters {
  /** only what is worth going out for: see BEST_MIN_SCORE */
  onlyBest: boolean;
  minScore: number;
  /** empty = all */
  interpretations: Interpretation[];
  /** empty = all */
  priorities: Priority[];
  showProtected: boolean;
  showNatural: boolean;
  /** 'nieokreslona' is most of a real sheet (small irregularities) */
  showUndetermined: boolean;
  showRejected: boolean;
}

export const DEFAULT_FILTERS: CandidateFilters = {
  onlyBest: true,
  minScore: 0,
  interpretations: [],
  priorities: [],
  showProtected: true,
  showNatural: false,
  showUndetermined: false,
  showRejected: false,
};

/** Rendering more rows than this makes the list sluggish; the map still shows all. */
export const LIST_LIMIT = 200;

/**
 * "Tylko najlepsze": the least score per priority; lower priorities ('niski') never, unless the
 * map context raised them. Accepted and protected candidates are not affected.
 */
export const BEST_MIN_SCORE: Partial<Record<Priority, number>> = {
  najwyzszy: 30,
  wysoki: 35,
  sredni: 50,
};
