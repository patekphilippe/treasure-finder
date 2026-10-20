import type { Sighting } from '@/shared/types/domain';
import type { ViewSource } from '../services/captureView';

/** The map in view as the place an object was seen: which map, its years, how and when. */
export function viewSighting(
  source: Pick<ViewSource, 'ref' | 'years'>,
  how: Sighting['how'],
  at = Date.now(),
): Sighting {
  return { map: source.ref, ...(source.years && { years: source.years }), at, how };
}
