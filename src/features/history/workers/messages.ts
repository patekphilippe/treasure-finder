import type { FrameQuad } from '@/shared/lib/georef';

export interface SnapFrameRequest {
  /** the scan, transferred to the worker */
  bitmap: ImageBitmap;
  /** the frame corners read by AI, in pixels of the bitmap */
  frame: FrameQuad;
}

export interface SnapFrameResponse {
  /** the corners on the scan's frame lines; null when none were found */
  frame: FrameQuad | null;
}
