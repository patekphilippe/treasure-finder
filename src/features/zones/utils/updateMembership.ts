import { distanceToZoneEdge } from '@/shared/lib/geo';
import type { Zone } from '@/shared/types/domain';
import { ACCURACY_SHARE, HYSTERESIS_M, MAX_ACCURACY_MARGIN_M } from '../config/alerts';

export type Membership = Record<string, boolean>;

/** Inside/outside per zone with hysteresis; the first reading for a zone is taken as is. */
export function updateMembership(
  prev: Membership,
  lat: number,
  lng: number,
  accM: number,
  zones: readonly Zone[],
): Membership {
  const margin = HYSTERESIS_M + Math.min(MAX_ACCURACY_MARGIN_M, Math.max(0, accM) * ACCURACY_SHARE);
  const next: Membership = {};
  for (const zone of zones) {
    const d = distanceToZoneEdge(lat, lng, zone.geometry);
    const was = prev[zone.id];
    if (was === undefined) next[zone.id] = d > 0;
    else if (was && d < -margin) next[zone.id] = false;
    else if (!was && d > margin) next[zone.id] = true;
    else next[zone.id] = was;
  }
  return next;
}
