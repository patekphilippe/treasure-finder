import type { OwnMap } from '@/shared/types/domain';

/** The own maps on the map: with a year chosen on the slider those of that year, else the ones switched on. */
export function shownMaps(maps: readonly OwnMap[], year: number | null): OwnMap[] {
  return year === null ? maps.filter((m) => m.visible) : maps.filter((m) => m.year === year);
}
