import type { OwnMap } from '@/shared/types/domain';

/** Your maps are chosen a year at a time: the key of the year group a map belongs to. */
export const oldMapKey = (m: Pick<OwnMap, 'year'>): string =>
  m.year ? String(m.year) : 'bez-roku';
