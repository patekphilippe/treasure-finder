import { haversine } from '@/shared/lib/geo';
import type { RoughArea } from '@/shared/types/domain';
import { SAME_PLACE_M } from '../config/places';
import type { RoughnessHotspot } from '../services/types';

/** Areas of a new analysis → places. A place within 40 m is updated (number and note kept). */
export function mergeAreas(
  existing: readonly RoughArea[],
  found: readonly RoughnessHotspot[],
  now: number,
  newId: () => string,
): RoughArea[] {
  let next = existing.reduce((max, a) => Math.max(max, a.no), 0) + 1;
  const pool = [...existing];
  return found.map((h) => {
    const match = pool.find((a) => haversine(a.lat, a.lng, h.lat, h.lng) <= SAME_PLACE_M);
    if (match) {
      pool.splice(pool.indexOf(match), 1);
      return {
        ...match,
        lat: h.lat,
        lng: h.lng,
        areaM2: h.areaM2,
        strength: h.strength,
        elongation: h.elongation,
        updated: now,
      };
    }
    return {
      id: newId(),
      no: next++,
      lat: h.lat,
      lng: h.lng,
      areaM2: h.areaM2,
      strength: h.strength,
      elongation: h.elongation,
      note: '',
      created: now,
      updated: now,
    };
  });
}
