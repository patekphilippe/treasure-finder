import { useMembership } from '@/shared/store/useMembership';
import type { ContextFeature } from '@/shared/types/domain';
import { useToastStore } from '@/shared/ui';
import { useContextStore } from '../store/useContextStore';
import { communityApi } from './communityApi';

/** the server takes this many at once */
const REMOVALS_PER_CALL = 1000;

/**
 * Removes objects here and, for the member's own ones, in the shared base (else the next sync
 * would bring them back). Someone else's shared objects are theirs to remove and are left. When
 * the shared base refuses, nothing is changed. Returns how many were removed, or null.
 */
export async function removeObjects(features: readonly ContextFeature[]): Promise<number | null> {
  const showToast = useToastStore.getState().show;
  const removable = features.filter((f) => !f.community || f.community.mineAuthor);
  const shared = removable.filter((f) => f.community).map((f) => f.community!.id);
  if (shared.length) {
    if (!useMembership.getState().email) {
      showToast('Zaloguj się: część tych obiektów jest we wspólnej bazie');
      return null;
    }
    try {
      for (let i = 0; i < shared.length; i += REMOVALS_PER_CALL)
        await communityApi.removeMany(shared.slice(i, i + REMOVALS_PER_CALL));
    } catch (e) {
      showToast(
        `Wspólna baza nie usunęła obiektów: ${e instanceof Error ? e.message : 'błąd'}. Nic nie zmieniono.`,
      );
      return null;
    }
  }
  for (const f of removable) await useContextStore.getState().remove(f.id);
  return removable.length;
}
