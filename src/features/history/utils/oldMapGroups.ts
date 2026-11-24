import type { OwnMap } from '@/shared/types/domain';
import { oldMapKey } from './oldMapKey';
import { readableMapName } from './readableMapName';

export interface OldMapGroup {
  key: string;
  year: number | null;
  /** by name */
  maps: OwnMap[];
}

/** Your maps as one choice per year (oldest first, maps without a year last). */
export function oldMapGroups(maps: readonly OwnMap[]): OldMapGroup[] {
  const groups = new Map<string, OldMapGroup>();
  for (const m of maps) {
    const key = oldMapKey(m);
    const group = groups.get(key) ?? { key, year: m.year ?? null, maps: [] };
    group.maps.push(m);
    groups.set(key, group);
  }
  for (const g of groups.values())
    g.maps.sort((a, b) => readableMapName(a.name).localeCompare(readableMapName(b.name), 'pl'));
  return [...groups.values()].sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
}
