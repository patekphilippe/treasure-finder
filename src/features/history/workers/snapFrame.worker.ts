/// <reference lib="webworker" />
import { snapFrame, type GrayWindow, type PixelRect } from '@/shared/lib/georef/snapFrame';
import type { SnapFrameRequest, SnapFrameResponse } from './messages';

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = (event: MessageEvent<SnapFrameRequest>) => {
  const { bitmap, frame } = event.data;
  // grey strips along the frame edges only: the whole scan is never unpacked at once
  const read = (r: PixelRect): GrayWindow => {
    const canvas = new OffscreenCanvas(r.width, r.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(bitmap, r.x, r.y, r.width, r.height, 0, 0, r.width, r.height);
    const rgba = ctx.getImageData(0, 0, r.width, r.height).data;
    const data = new Uint8Array(r.width * r.height);
    for (let i = 0; i < data.length; i++)
      data[i] = (rgba[4 * i]! * 77 + rgba[4 * i + 1]! * 150 + rgba[4 * i + 2]! * 29) >> 8;
    return { x0: r.x, y0: r.y, width: r.width, height: r.height, data };
  };
  let reply: SnapFrameResponse;
  try {
    reply = { frame: snapFrame(read, frame, { width: bitmap.width, height: bitmap.height }) };
  } catch {
    reply = { frame: null };
  }
  bitmap.close();
  self.postMessage(reply);
};
