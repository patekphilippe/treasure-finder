import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { sharedMapsApi } from './sharedMapsApi';

/** Removes an own map here and, when this member shared it, for the whole community too. */
export async function removeOwnMap(id: string): Promise<void> {
  const map = useOwnMapsStore.getState().maps.find((m) => m.id === id);
  if (map?.shared?.mine) await sharedMapsApi.remove(id);
  await useOwnMapsStore.getState().remove(id);
}
