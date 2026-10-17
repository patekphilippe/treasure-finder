import type { Hotspot } from '@/shared/lib/raster';

export interface RoughnessRequest {
  gray: Float32Array;
  valid: Uint8Array;
  w: number;
  h: number;
  /** metres per pixel */
  res: number;
}

export interface RoughnessResponse {
  rgba: Uint8ClampedArray<ArrayBuffer>;
  hotspots: Hotspot[];
}
