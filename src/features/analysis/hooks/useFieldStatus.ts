import { useMemo } from 'react';
import { usePointsStore } from '@/features/points';
import { fieldStatusByCandidate } from '../utils/fieldStatusByCandidate';

export function useFieldStatus() {
  const points = usePointsStore((s) => s.points);
  return useMemo(() => fieldStatusByCandidate(points), [points]);
}
