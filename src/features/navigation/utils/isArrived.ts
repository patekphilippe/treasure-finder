import { ARRIVAL_MAX_M, ARRIVAL_MIN_M } from '../config/arrival';

/** Within 5 m, or within the GPS accuracy when that is worse (capped at 15 m). */
export function isArrived(distM: number, accM: number | null): boolean {
  const radius = Math.min(ARRIVAL_MAX_M, Math.max(ARRIVAL_MIN_M, accM ?? 0));
  return distM <= radius;
}
