import { haversine } from '@/shared/lib/geo';
import type { RoughArea } from '@/shared/types/domain';
import { SAME_PLACE_M } from '../config/areaCategories';
import type { RoughnessHotspot } from '../services/types';
import { suggestCategory } from './suggestCategory';

/**
 * Areas of a new analysis → places. A place already within 40 m is updated, but a
 * category chosen by the user and the note are kept; others get the next number.
 */
export function mergeAreas(
  existing: readonly RoughArea[],
  found: readonly RoughnessHotspot[],
  now: number,
  newId: () => string,
): RoughArea[] {
  let next = existing.reduce((max, a) => Math.max(max, a.no), 0) + 1;
  const pool = [...existing];
  const out: RoughArea[] = [];
  for (const h of found) {
    const suggested = suggestCategory(h.areaM2, h.elongation);
    const match = pool.find((a) => haversine(a.lat, a.lng, h.lat, h.lng) <= SAME_PLACE_M);
    if (match) {
      pool.splice(pool.indexOf(match), 1);
      out.push({
        ...match,
        lat: h.lat,
        lng: h.lng,
        areaM2: h.areaM2,
        strength: h.strength,
        elongation: h.elongation,
        category: match.auto ? suggested : match.category,
        updated: now,
      });
    } else {
      out.push({
        id: newId(),
        no: next++,
        lat: h.lat,
        lng: h.lng,
        areaM2: h.areaM2,
        strength: h.strength,
        elongation: h.elongation,
        category: suggested,
        auto: true,
        note: '',
        created: now,
        updated: now,
      });
    }
  }
  return out;
}
