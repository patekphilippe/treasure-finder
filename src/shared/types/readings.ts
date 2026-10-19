import type { MapObject } from '@/shared/lib/history';

/** Answer of the backend's POST /api/readings: what Claude read on one map view. */
export interface MapReading {
  objects: MapObject[];
  usage: { inputTokens: number; outputTokens: number };
}
