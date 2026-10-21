import { fromEpsg2180 } from '@/shared/lib/geo';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { useUiStore } from '@/shared/store/useUiStore';
import type { OwnMap } from '@/shared/types/domain';
import { mapCorners2180 } from './importOwnMap';

/** the map fits into this many screen pixels (a phone is ~360 wide) */
const FIT_PX = 320;

/**
 * Closes the sheet and flies to an own map, close enough to see it whole with its corners;
 * `offsetY` lifts it above a bar at the bottom.
 */
export function showOwnMap(m: OwnMap, offsetY = 0): void {
  const c = mapCorners2180(m);
  const xs = c.map((p) => p.x);
  const ys = c.map((p) => p.y);
  const [lat, lng] = fromEpsg2180(
    (Math.min(...xs) + Math.max(...xs)) / 2,
    (Math.min(...ys) + Math.max(...ys)) / 2,
  );
  const extentM = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  // web mercator: 156 543 m per pixel at zoom 0 on the equator
  const zoom = Math.log2((156_543 * Math.cos((lat * Math.PI) / 180) * FIT_PX) / extentM);
  useUiStore.getState().closeSheet();
  useMapViewStore
    .getState()
    .flyTo({ lat, lng, zoom: Math.max(8, Math.min(16, Math.floor(zoom))), offsetY });
}
