import type { OwnMap } from '@/shared/types/domain';
import { oldMapKey } from './oldMapKey';

export interface PickedOldMap {
  /** no old map on the map */
  none: boolean;
  /** the year group of your maps on the map, when they all are of one year */
  ownKey: string | null;
  /** the online map on the map */
  onlineId: string | null;
}

/** Which choice of "Stara mapa" matches what is on the map now. */
export function pickedOldMap(maps: readonly OwnMap[], historicalId: string | null): PickedOldMap {
  const keys = new Set(maps.filter((m) => m.visible).map(oldMapKey));
  return {
    none: keys.size === 0 && historicalId === null,
    ownKey: keys.size === 1 ? [...keys][0]! : null,
    onlineId: historicalId,
  };
}
