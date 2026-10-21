import { useMembership } from '@/shared/store/useMembership';
import type { ContextFeature } from '@/shared/types/domain';
import { useContextStore } from '../store/useContextStore';
import { toNewCommunityObject } from '../utils/toNewCommunityObject';
import { communityApi } from './communityApi';

/** the server takes this many at once */
const PER_CALL = 1000;

/**
 * Puts the member's own context objects into the shared base and links them locally: in
 * batches, each one write of the day's limit.
 */
export async function shareObjects(features: readonly ContextFeature[]): Promise<number> {
  if (!useMembership.getState().email) throw new Error('Najpierw zaloguj się do społeczności');
  const todo = features.flatMap((f) => {
    const obj = f.community ? null : toNewCommunityObject(f);
    return obj ? [{ f, obj }] : [];
  });
  const linked: ContextFeature[] = [];
  for (let i = 0; i < todo.length; i += PER_CALL) {
    const part = todo.slice(i, i + PER_CALL);
    const { ids } = await communityApi.addMany(part.map((t) => t.obj));
    linked.push(
      ...part.map(({ f }, k): ContextFeature => ({
        ...f,
        community: {
          id: ids[k]!,
          author: useMembership.getState().name,
          mineAuthor: true,
          up: 0,
          down: 0,
          mine: 0,
        },
      })),
    );
    // what was shared so far stays linked even if a later batch fails
    await useContextStore.getState().add(linked.slice(-part.length));
  }
  return linked.length;
}
