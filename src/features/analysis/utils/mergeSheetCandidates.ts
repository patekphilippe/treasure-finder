import { haversine } from '@/shared/lib/geo';
import type { Candidate } from '@/shared/types/domain';

/** A fresh candidate this close to an old one of the same sheet is the same place. */
const SAME_PLACE_M = 5;

export interface SheetMerge {
  toWrite: Candidate[];
  /** old candidates of the sheet that disappeared and were never decided */
  toDelete: string[];
}

/**
 * Re-running a sheet: the same place keeps its id, decision and note; new places get the next
 * free id; undecided old candidates not found again are removed; decided ones always stay.
 * A place accepted earlier that is now protected goes back to 'nowy' (it cannot be a target).
 */
export function mergeSheetCandidates(
  old: readonly Candidate[],
  fresh: readonly Candidate[],
): SheetMerge {
  const pool = [...old];
  const taken = new Set(old.map((o) => o.id));
  let n = 0;
  const nextId = (sheetId: string) => {
    let id: string;
    do id = `${sheetId}-${String(++n).padStart(4, '0')}`;
    while (taken.has(id));
    taken.add(id);
    return id;
  };
  const toWrite = fresh.map((c) => {
    const k = pool.findIndex((o) => haversine(o.lat, o.lng, c.lat, c.lng) <= SAME_PLACE_M);
    if (k < 0) return { ...c, id: nextId(c.sheetId) };
    const prev = pool.splice(k, 1)[0]!;
    const decision =
      c.priority === 'chroniony' && prev.decision === 'przyjety' ? 'nowy' : prev.decision;
    return { ...c, id: prev.id, decision, note: prev.note };
  });
  return { toWrite, toDelete: pool.filter((o) => o.decision === 'nowy').map((o) => o.id) };
}
