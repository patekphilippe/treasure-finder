import { createPoint, usePointsStore } from '@/features/points';
import type { Candidate, FieldPoint } from '@/shared/types/domain';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { candidatePointInput } from '../utils/candidatePointInput';

export class ProtectedCandidateError extends Error {}

/**
 * Accepting creates a point to check (anomalia, do_sprawdzenia, src analiza) — once.
 * Protected candidates (priority 'chroniony') can never become search targets.
 */
export async function acceptCandidate(c: Candidate, now = Date.now()): Promise<FieldPoint> {
  if (c.priority === 'chroniony') throw new ProtectedCandidateError(c.id);
  const points = usePointsStore.getState();
  let point = points.points.find((p) => p.candidateId === c.id);
  if (!point) {
    point = createPoint(candidatePointInput(c), now);
    await points.save(point);
  }
  await useAnalysisStore.getState().update({ ...c, decision: 'przyjety' });
  return point;
}

export async function rejectCandidate(c: Candidate): Promise<void> {
  await useAnalysisStore.getState().update({ ...c, decision: 'odrzucony' });
}

export async function restoreCandidate(c: Candidate): Promise<void> {
  await useAnalysisStore.getState().update({ ...c, decision: 'nowy' });
}

export async function setCandidateNote(c: Candidate, note: string): Promise<void> {
  const store = useAnalysisStore.getState();
  const current = store.candidates.find((x) => x.id === c.id) ?? c;
  await store.update({ ...current, note });
}
