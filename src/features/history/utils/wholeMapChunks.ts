import { crsTransform, fromEpsg2180 } from '@/shared/lib/geo';
import { applyHomography } from '@/shared/lib/georef';
import { coverChunks, READ_PROFILES, type ReadProfileId } from '@/shared/lib/history';
import type { Bounds } from '@/shared/store/useMapViewStore';
import type { OwnMap } from '@/shared/types/domain';
import { AI_MAX_SIDE } from '../config/aiReading';

/** a window a little under the profile's widest view: its WGS84 box grows slightly in EPSG:2180 */
const SIZE_MARGIN = 0.9;
/** neighbouring windows overlap, so an object on the seam is seen whole in one of them */
const MIN_OVERLAP_M = 150;

/**
 * The views that read a whole own map with a profile: windows over the map's footprint,
 * as map bounds. Null when the map's coordinate system is unknown.
 */
export function wholeMapChunks(map: OwnMap, profile: ReadProfileId): Bounds[] | null {
  const crs = crsTransform(map.epsg);
  if (!crs) return null;
  const footprint = [
    [0, 0],
    [map.width, 0],
    [map.width, map.height],
    [0, map.height],
  ].map(([x, y]) => {
    const p = applyHomography(map.pixelToSource, { x: x!, y: y! });
    return crs.to2180(p.x, p.y);
  });
  const sizeM = READ_PROFILES[profile].maxResM * AI_MAX_SIDE * SIZE_MARGIN;
  return coverChunks(footprint, sizeM, Math.max(MIN_OVERLAP_M, sizeM * 0.05)).map((c) => {
    const corners = [
      fromEpsg2180(c.minE, c.maxN),
      fromEpsg2180(c.maxE, c.maxN),
      fromEpsg2180(c.minE, c.minN),
      fromEpsg2180(c.maxE, c.minN),
    ];
    // the inner box: its EPSG:2180 box stays within the window's size
    return {
      north: Math.min(corners[0]![0], corners[1]![0]),
      south: Math.max(corners[2]![0], corners[3]![0]),
      west: Math.max(corners[0]![1], corners[2]![1]),
      east: Math.min(corners[1]![1], corners[3]![1]),
    };
  });
}
