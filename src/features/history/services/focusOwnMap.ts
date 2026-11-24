import { useLayersStore } from '@/features/layers';
import type { OwnMap } from '@/shared/types/domain';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { showOwnMap } from './showOwnMap';

/**
 * A map just added, alone on the map: the online map off, your other maps hidden (back in
 * Warstwy, "Stara mapa"), then the view flies to it.
 */
export async function focusOwnMap(map: OwnMap): Promise<void> {
  const store = useOwnMapsStore.getState();
  useLayersStore.getState().setHistoricalId(null);
  for (const m of store.maps) {
    const visible = m.id === map.id;
    if (m.visible !== visible) await store.update(m.id, { visible });
  }
  showOwnMap(map);
}
