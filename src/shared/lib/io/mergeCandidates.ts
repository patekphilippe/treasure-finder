import type { Candidate } from '@/shared/types/domain';

export interface CandidateMerge {
  toWrite: Candidate[];
  added: number;
  updated: number;
}

/**
 * Re-imported candidates (e.g. after recalibrating in QGIS) replace measurements and score,
 * but the user's decision and note made on this device are kept.
 */
export function mergeCandidates(
  local: readonly Candidate[],
  incoming: readonly Candidate[],
): CandidateMerge {
  const byId = new Map(local.map((c) => [c.id, c]));
  const result: CandidateMerge = { toWrite: [], added: 0, updated: 0 };
  for (const c of incoming) {
    const mine = byId.get(c.id);
    if (!mine) {
      result.toWrite.push(c);
      result.added++;
      continue;
    }
    result.toWrite.push({
      ...c,
      decision: mine.decision !== 'nowy' ? mine.decision : c.decision,
      note: mine.note || c.note,
    });
    result.updated++;
  }
  return result;
}
