import type { HistoricalLayer } from '../config/historicalLayers';

/** Extra WMS parameters: a whole-year TIME range for layers with a time dimension. */
export function historicalWmsParams(
  layer: HistoricalLayer,
  year: number,
): Record<string, string> {
  if (!layer.yearRange) return {};
  const y = Math.min(layer.yearRange.max, Math.max(layer.yearRange.min, Math.round(year)));
  return { TIME: `${y}-01-01/${y}-12-31` };
}
