import { fromEpsg2180 } from '@/shared/lib/geo';
import type { Bounds } from '@/shared/store/useMapViewStore';
import type { OwnMap } from '@/shared/types/domain';
import { mapCorners2180 } from '../services/importOwnMap';

/** Whether any part of an own map is in the view (no view yet counts as not). */
export function ownMapInView(m: OwnMap, view: Bounds | null): boolean {
  if (!view) return false;
  const corners = mapCorners2180(m).map((p) => fromEpsg2180(p.x, p.y));
  const lats = corners.map(([lat]) => lat);
  const lngs = corners.map(([, lng]) => lng);
  return (
    Math.min(...lats) <= view.north &&
    Math.max(...lats) >= view.south &&
    Math.min(...lngs) <= view.east &&
    Math.max(...lngs) >= view.west
  );
}
