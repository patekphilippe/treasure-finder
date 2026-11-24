import { useLayersStore } from '@/features/layers';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { oldMapKey } from '../utils/oldMapKey';
import { ownMapInView } from '../utils/ownMapInView';
import { showOwnMap } from './showOwnMap';

export type OldMapChoice =
  { kind: 'none' } | { kind: 'own'; key: string } | { kind: 'online'; id: string };

/**
 * One old map at a time: your maps of one year, or one map from the internet, or none. The
 * choice is kept in the maps' own switches and the layer settings, so it survives a restart.
 * Your maps out of view: the view flies to them, so the tap always shows something.
 */
export async function chooseOldMap(choice: OldMapChoice): Promise<void> {
  useLayersStore.getState().setHistoricalId(choice.kind === 'online' ? choice.id : null);
  const store = useOwnMapsStore.getState();
  const picked = store.maps.filter((m) => choice.kind === 'own' && oldMapKey(m) === choice.key);
  for (const m of store.maps) {
    const visible = picked.includes(m);
    if (m.visible !== visible) await store.update(m.id, { visible });
  }
  const view = useMapViewStore.getState().bounds;
  if (picked.length && !picked.some((m) => ownMapInView(m, view))) showOwnMap(picked[0]!);
}
