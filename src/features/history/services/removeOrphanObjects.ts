import { useToastStore } from '@/shared/ui';
import { useContextStore } from '../store/useContextStore';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { orphanObjects } from '../utils/orphanObjects';
import { removeObjects } from './removeObjects';

/**
 * The objects left behind by maps removed before they went with their map. The maps are read
 * from the device again first, so a map still loading never counts as removed.
 */
export async function removeOrphanObjects(): Promise<number> {
  await useOwnMapsStore.getState().load();
  const ids = new Set(useOwnMapsStore.getState().maps.map((m) => m.id));
  const removed = await removeObjects(orphanObjects(useContextStore.getState().features, ids));
  if (removed !== null)
    useToastStore.getState().show(`Usunięto ${removed} obiektów z usuniętych map`);
  return removed ?? 0;
}
