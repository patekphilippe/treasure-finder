import { BACKEND_ENABLED } from '@/shared/config/backend';
import { useMembership } from '@/shared/store/useMembership';
import { useToastStore } from '@/shared/ui';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { sharedMapsApi } from './sharedMapsApi';

/**
 * Puts an own map on the server for the community: the scan the first time, later only its
 * placement, year and AI reading. Someone else's map is not changed. Quiet without signing in.
 */
export async function shareMap(id: string): Promise<void> {
  if (!BACKEND_ENABLED || !useMembership.getState().email) return;
  const map = useOwnMapsStore.getState().maps.find((m) => m.id === id);
  if (!map || (map.shared && !map.shared.mine)) return;
  try {
    const saved = await sharedMapsApi.put(map, !map.shared);
    await useOwnMapsStore.getState().update(id, {
      shared: { mine: true, author: saved.author, updatedAt: saved.updatedAt },
    });
  } catch (e) {
    useToastStore
      .getState()
      .show(`Mapa ${map.name} została tylko tutaj: ${e instanceof Error ? e.message : 'błąd'}`);
  }
}
