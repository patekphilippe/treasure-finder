import { useToastStore } from '@/shared/ui';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { removeOrphanObjects } from './removeOrphanObjects';
import { removeOwnMap } from './removeOwnMap';

/**
 * Every map of this member removed, each with the objects only it showed (removeOwnMap), then
 * what earlier removals left behind. Other members' shared maps stay: they are theirs.
 */
export async function removeAllOwnMaps(): Promise<number> {
  const mine = useOwnMapsStore.getState().maps.filter((m) => !m.shared || m.shared.mine);
  for (const m of mine) await removeOwnMap(m.id);
  const left = useOwnMapsStore.getState().maps.filter((m) => mine.some((x) => x.id === m.id));
  await removeOrphanObjects();
  const removed = mine.length - left.length;
  useToastStore
    .getState()
    .show(
      left.length
        ? `Usunięto ${removed} map, ${left.length} zostało (wspólna baza odmówiła)`
        : `Usunięto ${removed} map razem z ich obiektami`,
    );
  return removed;
}
