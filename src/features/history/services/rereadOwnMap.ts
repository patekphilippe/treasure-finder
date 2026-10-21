import { useMembership } from '@/shared/store/useMembership';
import { useToastStore } from '@/shared/ui';
import { useContextStore } from '../store/useContextStore';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { seenOnlyOnMap } from '../utils/seenOnlyOnMap';
import { autoReadMap } from './autoReadMap';
import { communityApi } from './communityApi';

/** the server takes this many at once */
const REMOVALS_PER_CALL = 1000;

/**
 * A bad reading thrown away and the map read again (with the profile its scale needs): the
 * objects seen only on this map go, here and, for the member's own ones, in the shared base
 * (else the next sync would bring them back). Objects other maps confirm stay. Returns how many
 * were removed.
 */
export async function rereadOwnMap(mapId: string): Promise<number> {
  const showToast = useToastStore.getState().show;
  const map = useOwnMapsStore.getState().maps.find((m) => m.id === mapId);
  if (!map) return 0;
  const found = seenOnlyOnMap(useContextStore.getState().features, mapId);
  // someone else's shared objects are theirs to remove: they would come back with the next sync
  const removable = found.filter((f) => !f.community || f.community.mineAuthor);
  const shared = removable.filter((f) => f.community).map((f) => f.community!.id);
  if (shared.length) {
    if (!useMembership.getState().email) {
      showToast('Zaloguj się: obiekty z tej mapy są we wspólnej bazie');
      return 0;
    }
    try {
      for (let i = 0; i < shared.length; i += REMOVALS_PER_CALL)
        await communityApi.removeMany(shared.slice(i, i + REMOVALS_PER_CALL));
    } catch (e) {
      showToast(
        `Wspólna baza nie usunęła obiektów: ${e instanceof Error ? e.message : 'błąd'}. Nic nie zmieniono.`,
      );
      return 0;
    }
  }
  for (const f of removable) await useContextStore.getState().remove(f.id);
  await useOwnMapsStore.getState().update(map.id, { readAt: undefined });
  showToast(`${map.name}: usunięto ${removable.length} obiektów, AI czyta mapę od nowa`);
  void autoReadMap(map.id);
  return removable.length;
}
