import type { HistoricalLayer } from '@/features/layers';
import type { OwnMap } from '@/shared/types/domain';

export interface YearStops {
  /** the years the slider stops at, oldest first */
  stops: number[];
  /** the stops with a year written under the track */
  labelled: number[];
}

/**
 * Where the time slider stops: the years of your maps, the first year of each online edition and
 * every orthophoto year. A slider over 140 years in steps of one cannot be hit with a finger;
 * these stops can. Labels go to your years first, then the ends, never closer than `gapShare`
 * of the span to each other.
 */
export function yearStops(
  maps: readonly OwnMap[],
  layers: readonly HistoricalLayer[],
  gapShare = 0.1,
): YearStops {
  const own = [...new Set(maps.flatMap((m) => (m.year ? [m.year] : [])))].sort((a, b) => a - b);
  const online = layers.flatMap((l) => [
    ...(l.yearSpan ? [l.yearSpan.from] : []),
    ...(l.yearRange
      ? Array.from(
          { length: l.yearRange.max - l.yearRange.min + 1 },
          (_, i) => l.yearRange!.min + i,
        )
      : []),
  ]);
  const stops = [...new Set([...own, ...online])].sort((a, b) => a - b);
  if (!stops.length) return { stops, labelled: [] };
  const min = stops[0]!;
  const max = stops[stops.length - 1]!;
  const gap = (max - min) * gapShare;
  const labelled: number[] = [];
  for (const y of [...own, min, max])
    if (labelled.every((l) => Math.abs(l - y) >= gap)) labelled.push(y);
  return { stops, labelled: labelled.sort((a, b) => a - b) };
}
