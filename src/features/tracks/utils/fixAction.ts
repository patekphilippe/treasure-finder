import { acceptFix } from '@/features/gps';
import { haversine } from '@/shared/lib/geo';
import type { GpsFix } from '@/shared/store/useFieldStore';
import { GAP_MS, JUMPS_BEFORE_NEW_SEGMENT, MAX_SPEED_MPS, STALE_FIX_MS } from '../config/recording';

export type FixAction = 'skip' | 'jump' | 'append' | 'newSegment';

/**
 * What the recorder does with a fix: skip it (stale, inaccurate, too close), treat it as
 * a GPS jump, append it, or start a new segment (after a gap or repeated jumps).
 * `jumpsInRow` is how many fixes in a row were jumps.
 */
export function fixAction(
  prev: GpsFix | null,
  next: GpsFix,
  jumpsInRow: number,
  now: number,
): FixAction {
  if (now - next.t > STALE_FIX_MS) return 'skip';
  if (!acceptFix(prev, next)) return 'skip';
  if (!prev) return 'append';
  const dt = (next.t - prev.t) / 1000;
  if (dt * 1000 > GAP_MS) return 'newSegment';
  const d = haversine(prev.lat, prev.lng, next.lat, next.lng);
  const beyondAccuracy = d - prev.accM - next.accM;
  if (beyondAccuracy > 0 && beyondAccuracy / Math.max(dt, 1) > MAX_SPEED_MPS)
    return jumpsInRow + 1 >= JUMPS_BEFORE_NEW_SEGMENT ? 'newSegment' : 'jump';
  return 'append';
}
