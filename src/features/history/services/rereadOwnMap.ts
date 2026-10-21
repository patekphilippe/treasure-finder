import { useToastStore } from '@/shared/ui';
import { useContextStore } from '../store/useContextStore';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { seenOnlyOnMap } from '../utils/seenOnlyOnMap';
import { autoReadMap } from './autoReadMap';
import { removeObjects } from './removeObjects';

/**
 * A bad reading thrown away and the map read again (with the profile its scale needs): the
 * objects seen only on this map go (removeObjects); objects other maps confirm stay. Returns how
 * many were removed.
 */
export async function rereadOwnMap(mapId: string): Promise<number> {
  const map = useOwnMapsStore.getState().maps.find((m) => m.id === mapId);
  if (!map) return 0;
  const removed = await removeObjects(seenOnlyOnMap(useContextStore.getState().features, mapId));
  if (removed === null) return 0;
  await useOwnMapsStore.getState().update(map.id, { readAt: undefined });
  useToastStore.getState().show(`${map.name}: usunięto ${removed} obiektów, AI czyta mapę od nowa`);
  void autoReadMap(map.id);
  return removed;
}
