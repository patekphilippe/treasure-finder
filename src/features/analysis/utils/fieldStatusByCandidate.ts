import type { FieldPoint, PointStatus } from '@/shared/types/domain';

/** Status of the point created from each accepted candidate (results come back from the phone via ZIP). */
export function fieldStatusByCandidate(points: readonly FieldPoint[]): Map<string, PointStatus> {
  const map = new Map<string, PointStatus>();
  for (const p of points) if (p.candidateId) map.set(p.candidateId, p.status);
  return map;
}
