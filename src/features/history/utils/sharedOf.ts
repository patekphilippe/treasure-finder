import type { SharedMap } from '@/shared/types/community';
import type { OwnMap } from '@/shared/types/domain';

/** What an own map remembers of its copy on the server. */
export const sharedOf = (r: SharedMap): NonNullable<OwnMap['shared']> => ({
  mine: r.mine,
  author: r.author,
  updatedAt: r.updatedAt,
});
