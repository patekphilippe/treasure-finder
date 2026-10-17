import type { FieldPoint, PointType } from '@/shared/types/domain';
import { POINT_TYPES } from '../config/pointTypes';

/** "Anomalia 4" — next number among existing points of that type. */
export function defaultPointName(type: PointType, existing: readonly FieldPoint[]): string {
  const count = existing.filter((p) => p.type === type).length;
  return `${POINT_TYPES[type].label} ${count + 1}`;
}
