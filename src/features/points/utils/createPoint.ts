import { createId } from '@/shared/lib/createId';
import type { FieldPoint } from '@/shared/types/domain';

export type NewPointInput = Pick<
  FieldPoint,
  'type' | 'name' | 'desc' | 'depthCm' | 'lat' | 'lng' | 'accM' | 'src' | 'photoId'
> &
  Partial<Pick<FieldPoint, 'status' | 'candidateId' | 'flags'>>;

export function createPoint(input: NewPointInput, now: number): FieldPoint {
  return {
    id: createId(),
    status: 'do_sprawdzenia',
    ...input,
    accM: input.src === 'gps' ? input.accM : null,
    created: now,
    updated: now,
  };
}
