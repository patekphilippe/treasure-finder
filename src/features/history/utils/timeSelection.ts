import type { HistoricalLayer } from '@/features/layers';
import type { OwnMap } from '@/shared/types/domain';
import { readableMapName } from './readableMapName';

export interface TimeSelection {
  /** own maps shown: the years with a map of that year (empty: none of them) */
  years: number[];
  /** the online historical map for that year, or null */
  layerId: string | null;
  /** its year, for a layer with a year to choose (archival orthophoto) */
  layerYear: number | null;
  /** what the year shows, for the caption under the slider */
  shown: string[];
}

/**
 * What one year on the time slider shows: your maps of that year, and the online map that covers
 * it (an orthophoto of that year, else the edition whose years hold it, the latest one first).
 */
export function timeSelection(
  year: number,
  maps: readonly OwnMap[],
  layers: readonly HistoricalLayer[],
): TimeSelection {
  const own = maps.filter((m) => m.year === year);
  const byYear = layers.find(
    (l) => l.yearRange && l.yearRange.min <= year && year <= l.yearRange.max,
  );
  const bySpan = layers
    .filter((l) => l.yearSpan && l.yearSpan.from <= year && year <= l.yearSpan.to)
    .sort((a, b) => b.yearSpan!.from - a.yearSpan!.from)[0];
  const layer = byYear ?? bySpan ?? null;
  return {
    years: own.length ? [year] : [],
    layerId: layer?.id ?? null,
    layerYear: byYear ? year : null,
    shown: [
      ...own.map((m) => `${readableMapName(m.name)} (Twoja mapa)`),
      ...(layer ? [layer.label] : []),
    ],
  };
}
