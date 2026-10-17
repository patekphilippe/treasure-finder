import { useEffect, useRef } from 'react';
import { usePointsStore } from '@/features/points';
import { bearing, haversine } from '@/shared/lib/geo';
import { useFieldStore } from '@/shared/store/useFieldStore';
import type { FieldPoint } from '@/shared/types/domain';
import { useToastStore } from '@/shared/ui';
import { ARRIVAL_VIBRATION } from '../config/arrival';
import { isArrived } from '../utils/isArrived';
import { relativeBearing } from '../utils/relativeBearing';

export interface Guidance {
  target: FieldPoint;
  distM: number | null;
  /** absolute bearing to the target, degrees from north */
  bearing: number | null;
  /** arrow angle relative to where the phone points; null without a compass */
  relative: number | null;
  arrived: boolean;
}

/** Direction and distance to the navigation target; vibrates once on arrival. */
export function useGuidance(): Guidance | null {
  const targetId = useFieldStore((s) => s.navigationTargetId);
  const position = useFieldStore((s) => s.position);
  const heading = useFieldStore((s) => s.heading);
  const target = usePointsStore((s) => s.points.find((p) => p.id === targetId));
  const wasArrived = useRef(false);

  let guidance: Guidance | null = null;
  if (target) {
    const distM = position ? haversine(position.lat, position.lng, target.lat, target.lng) : null;
    const b = position ? bearing(position.lat, position.lng, target.lat, target.lng) : null;
    guidance = {
      target,
      distM,
      bearing: b,
      relative: b !== null && heading !== null ? relativeBearing(b, heading) : null,
      arrived: distM !== null && isArrived(distM, position?.accM ?? null),
    };
  }
  const arrived = guidance?.arrived ?? false;
  const targetName = target?.name;

  useEffect(() => {
    if (arrived && !wasArrived.current) {
      navigator.vibrate?.(ARRIVAL_VIBRATION);
      useToastStore.getState().show(`Jesteś na miejscu: ${targetName}`);
    }
    wasArrived.current = arrived;
  }, [arrived, targetName]);

  useEffect(() => {
    wasArrived.current = false;
  }, [targetId]);

  return guidance;
}
