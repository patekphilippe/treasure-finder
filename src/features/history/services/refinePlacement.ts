import type { FrameQuad } from '@/shared/lib/georef';
import type { MapPlacement } from '@/shared/types/placement';
import { cornersFromFrame } from '../utils/cornersFromFrame';
import type { SnapFrameRequest, SnapFrameResponse } from '../workers/messages';

/** larger scans are left as placed: decoding them could exhaust a phone's memory */
const MAX_PIXELS = 60e6;
/** the worker takes well under a second; past this the backend's corners stay */
const TIMEOUT_MS = 20_000;

function snapInWorker(request: SnapFrameRequest): Promise<FrameQuad | null> {
  const worker = new Worker(new URL('../workers/snapFrame.worker.ts', import.meta.url), {
    type: 'module',
  });
  return new Promise<FrameQuad | null>((resolve) => {
    const timer = setTimeout(() => resolve(null), TIMEOUT_MS);
    worker.onmessage = (e: MessageEvent<SnapFrameResponse>) => {
      clearTimeout(timer);
      resolve(e.data.frame);
    };
    worker.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    worker.postMessage(request, [request.bitmap]);
  }).finally(() => worker.terminate());
}

/**
 * A placement by the sheet frame made exact: the frame corners Claude read on a reduced image are
 * snapped to the frame lines of the full scan (in a worker) and the scan is fitted again. Without
 * a frame, or when no lines are found, the backend's corners stay.
 */
export async function refinePlacement(
  file: Blob,
  placement: MapPlacement,
): Promise<MapPlacement['corners']> {
  const frame = placement.frame;
  if (frame?.image.length !== 4 || frame.at.length !== 4) return placement.corners;
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    if (width * height > MAX_PIXELS) {
      bitmap.close();
      return placement.corners;
    }
    const read = frame.image.map((p) => ({ x: p.x * width, y: p.y * height }));
    const snapped = await snapInWorker({ bitmap, frame: read as unknown as FrameQuad });
    return snapped ? cornersFromFrame(snapped, frame.at, width, height) : placement.corners;
  } catch {
    return placement.corners;
  }
}
