import { useMembership } from '@/shared/store/useMembership';
import type { ContextFeature } from '@/shared/types/domain';
import { useContextStore } from '../store/useContextStore';
import { toNewCommunityObject } from '../utils/toNewCommunityObject';
import { communityApi } from './communityApi';

/** Puts the member's own context objects into the shared base and links them locally. */
export async function shareObjects(features: readonly ContextFeature[]): Promise<number> {
  const code = useMembership.getState().code;
  if (!code) throw new Error('Najpierw dołącz do społeczności');
  const linked: ContextFeature[] = [];
  for (const f of features) {
    const obj = toNewCommunityObject(f);
    if (!obj || f.community) continue;
    const { id } = await communityApi.add(code, obj);
    linked.push({
      ...f,
      community: {
        id,
        author: useMembership.getState().name,
        mineAuthor: true,
        up: 0,
        down: 0,
        mine: 0,
      },
    });
  }
  if (linked.length) await useContextStore.getState().add(linked);
  return linked.length;
}
