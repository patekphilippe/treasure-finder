import type { HistoricalLayer } from '@/features/layers';
import type { OwnMap } from '@/shared/types/domain';

/** The years the time slider spans: from the oldest map, own or online, to the newest. */
export function timeRange(
  maps: readonly OwnMap[],
  layers: readonly HistoricalLayer[],
): { min: number; max: number } | null {
  const years = [
    ...maps.flatMap((m) => (m.year ? [m.year] : [])),
    ...layers.flatMap((l) => [
      ...(l.yearSpan ? [l.yearSpan.from, l.yearSpan.to] : []),
      ...(l.yearRange ? [l.yearRange.min, l.yearRange.max] : []),
    ]),
  ];
  return years.length ? { min: Math.min(...years), max: Math.max(...years) } : null;
}
