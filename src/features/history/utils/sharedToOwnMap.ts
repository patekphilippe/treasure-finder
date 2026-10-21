import type { SharedMap } from '@/shared/types/community';
import type { OwnMap } from '@/shared/types/domain';
import { sharedOf } from './sharedOf';

/** A community map downloaded here: the author's own maps shown at once, others' to switch on. */
export function sharedToOwnMap(r: SharedMap, image: Blob, now: number): OwnMap {
  return {
    id: r.id,
    name: r.name,
    created: now,
    image,
    width: r.width,
    height: r.height,
    pixelToSource: r.pixelToSource,
    epsg: r.epsg,
    method: r.method,
    visible: r.mine,
    opacity: 0.8,
    ...(r.year !== null && { year: r.year }),
    ...(r.readAt !== null && { readAt: r.readAt }),
    shared: sharedOf(r),
  };
}
