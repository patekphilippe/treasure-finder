import { crsTransform } from '@/shared/lib/geo';
import { applyHomography } from '@/shared/lib/georef';
import { READ_PROFILES, type ReadProfileId } from '@/shared/lib/history';
import type { OwnMap } from '@/shared/types/domain';

/**
 * Metres per pixel to read an own map at: the profile's finest, or the scan's own resolution when
 * it is coarser (a 1:100 000 sheet): reading finer than the scan only costs more windows.
 */
export function readResM(map: OwnMap, profile: ReadProfileId): number {
  const finest = READ_PROFILES[profile].maxResM;
  const crs = crsTransform(map.epsg);
  if (!crs) return finest;
  const [tl, tr, bl] = [
    [0, 0],
    [map.width, 0],
    [0, map.height],
  ].map(([x, y]) => {
    const p = applyHomography(map.pixelToSource, { x: x!, y: y! });
    return crs.to2180(p.x, p.y);
  }) as [[number, number], [number, number], [number, number]];
  const widthM = Math.hypot(tr[0] - tl[0], tr[1] - tl[1]);
  const heightM = Math.hypot(bl[0] - tl[0], bl[1] - tl[1]);
  const native = (widthM / map.width + heightM / map.height) / 2;
  return Number.isFinite(native) ? Math.max(finest, native) : finest;
}
