import type { Bounds } from '@/shared/store/useMapViewStore';

/** A map area saved for use without signal. */
export interface OfflineArea {
  id: string;
  name: string;
  /** ISO date */
  created: string;
  bounds: Bounds;
  /** names of the saved layers, for the list */
  layers: string[];
  tiles: number;
  bytes: number;
  failed: number;
}
