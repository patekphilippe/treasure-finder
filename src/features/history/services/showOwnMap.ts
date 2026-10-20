import { fromEpsg2180 } from '@/shared/lib/geo';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { useUiStore } from '@/shared/store/useUiStore';
import type { OwnMap } from '@/shared/types/domain';
import { mapCorners2180 } from './importOwnMap';

/** Closes the sheet and flies to the middle of an own map. */
export function showOwnMap(m: OwnMap): void {
  const c = mapCorners2180(m);
  const [lat, lng] = fromEpsg2180((c[0]!.x + c[2]!.x) / 2, (c[0]!.y + c[2]!.y) / 2);
  useUiStore.getState().closeSheet();
  useMapViewStore.getState().flyTo({ lat, lng, zoom: 14 });
}
