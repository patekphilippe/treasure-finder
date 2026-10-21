import type { MapObject, ReadKind } from '@/shared/lib/history/types';

/** Answer of the backend's POST /api/readings: what Claude read on one map view. */
export interface MapReading {
  objects: MapObject<ReadKind>[];
  usage: { inputTokens: number; outputTokens: number };
  /** the legend profile: its entries, "sign: meaning" */
  legend?: string[];
}
