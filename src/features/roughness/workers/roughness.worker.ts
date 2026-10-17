/// <reference lib="webworker" />
import { hotspots, roughness } from '@/shared/lib/raster';
import { HOTSPOT_MIN_AREA_M2, HOTSPOT_THRESHOLD } from '../config/roughness';
import { heatColors } from '../services/heatColors';
import type { RoughnessRequest, RoughnessResponse } from './messages';

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = (event: MessageEvent<RoughnessRequest>) => {
  const { gray, valid, w, h, res } = event.data;
  const score = roughness(gray, w, h, valid);
  const spots = hotspots(
    score,
    w,
    h,
    HOTSPOT_THRESHOLD,
    Math.ceil(HOTSPOT_MIN_AREA_M2 / (res * res)),
  );
  const rgba = heatColors(score);
  const reply: RoughnessResponse = { rgba, hotspots: spots };
  self.postMessage(reply, [rgba.buffer]);
};
