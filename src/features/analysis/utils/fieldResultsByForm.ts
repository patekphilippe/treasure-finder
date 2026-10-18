import type { Candidate, Interpretation, PointStatus } from '@/shared/types/domain';

export interface InterpretationResults {
  interpretation: Interpretation;
  accepted: number;
  /** checked in the field (status other than do_sprawdzenia) */
  checked: number;
  finds: number;
  empty: number;
}

/** "How many finds per interpretation": the basis for adjusting weights by hand. */
export function fieldResultsByForm(
  candidates: readonly Candidate[],
  status: ReadonlyMap<string, PointStatus>,
): InterpretationResults[] {
  const rows = new Map<Interpretation, InterpretationResults>();
  for (const c of candidates) {
    const s = status.get(c.id);
    if (c.decision !== 'przyjety' && !s) continue;
    const row = rows.get(c.interpretation) ?? {
      interpretation: c.interpretation,
      accepted: 0,
      checked: 0,
      finds: 0,
      empty: 0,
    };
    row.accepted++;
    if (s && s !== 'do_sprawdzenia') row.checked++;
    if (s === 'znalezisko') row.finds++;
    if (s === 'pusto') row.empty++;
    rows.set(c.interpretation, row);
  }
  return [...rows.values()].sort((a, b) => b.finds - a.finds || b.checked - a.checked);
}
