import { HISTORICAL_LAYERS, type HistoricalLayer } from '../config/historicalLayers';

export function findHistoricalLayer(id: string | null): HistoricalLayer | undefined {
  return id ? HISTORICAL_LAYERS.find((l) => l.id === id) : undefined;
}
