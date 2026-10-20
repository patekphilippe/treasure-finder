import type { OwnMap } from '@/shared/types/domain';

/** The years of the own maps, each once, oldest first: the stops of the year slider. */
export function mapYears(maps: readonly OwnMap[]): number[] {
  return [...new Set(maps.flatMap((m) => (m.year ? [m.year] : [])))].sort((a, b) => a - b);
}
