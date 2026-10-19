import type { GpsFix } from '@/shared/store/useFieldStore';
import { haversine } from '@/shared/lib/geo';
import { MAX_ACCURACY_M, MIN_STEP_M } from '../config/gps';

/**
 * Whether a GPS fix should be recorded: rejects fixes worse than 30 m and fixes closer than
 * 2 m (or a third of their accuracy, so jitter at ±15 m is not drawn) to the previous one.
 */
export function acceptFix(prev: GpsFix | null, next: GpsFix): boolean {
  if (!Number.isFinite(next.accM) || next.accM > MAX_ACCURACY_M) return false;
  if (!prev) return true;
  return haversine(prev.lat, prev.lng, next.lat, next.lng) >= Math.max(MIN_STEP_M, next.accM / 3);
}
