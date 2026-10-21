import type { OwnMap } from '@/shared/types/domain';

/** The own maps on the map: with years chosen (slider or list) the maps of those years, else the ones switched on. */
export function shownMaps(maps: readonly OwnMap[], years: readonly number[] | null): OwnMap[] {
  return years === null
    ? maps.filter((m) => m.visible)
    : maps.filter((m) => m.year !== undefined && years.includes(m.year));
}
