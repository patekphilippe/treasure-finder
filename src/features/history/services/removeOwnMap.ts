import { useContextStore } from '../store/useContextStore';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { seenOnlyOnMap } from '../utils/seenOnlyOnMap';
import { removeObjects } from './removeObjects';
import { sharedMapsApi } from './sharedMapsApi';

/**
 * Removes an own map here and, when this member shared it, for the whole community too, with the
 * objects only it showed (objects other maps confirm stay). When those cannot be removed from the
 * shared base, the map stays too.
 */
export async function removeOwnMap(id: string): Promise<void> {
  const map = useOwnMapsStore.getState().maps.find((m) => m.id === id);
  if ((await removeObjects(seenOnlyOnMap(useContextStore.getState().features, id))) === null)
    return;
  if (map?.shared?.mine) await sharedMapsApi.remove(id);
  await useOwnMapsStore.getState().remove(id);
}
