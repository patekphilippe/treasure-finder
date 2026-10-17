import { haversine } from '@/shared/lib/geo';
import type { FieldPoint } from '@/shared/types/domain';

export interface PointWithDistance {
  point: FieldPoint;
  distM: number | null;
}

/** Nearest first when the position is known; otherwise newest first. */
export function sortByDistance(
  points: readonly FieldPoint[],
  from: { lat: number; lng: number } | null,
): PointWithDistance[] {
  if (!from) {
    return [...points]
      .sort((a, b) => b.created - a.created)
      .map((point) => ({ point, distM: null }));
  }
  return points
    .map((point) => ({ point, distM: haversine(from.lat, from.lng, point.lat, point.lng) }))
    .sort((a, b) => a.distM - b.distM);
}
