import {
  colorize,
  grayColor,
  hillshadeMulti,
  lrmColor,
  slopeHorn,
  type Rgba,
} from '@/shared/lib/raster';
import type { Scene } from '@/shared/lib/detect';
import type { ReliefKind } from '@/shared/types/domain';
import type { ReliefImage } from './messages';

/** Longest image side: phones refuse bigger canvases (iOS ~16.7 Mpx). */
const MAX_SIDE = 4096;
/** slope shown black from this many degrees: micro-relief lives below 25° */
const SLOPE_DARK_DEG = 25;
/** hillshade stretch: flat ground (sin 35° ≈ 0.57) mid-grey, gentle slopes clearly lighter or darker */
const SHADE_LO = 0.3;
const SHADE_HI = 0.85;

async function encode(img: Rgba): Promise<Blob> {
  const canvas = new OffscreenCanvas(img.w, img.h);
  canvas.getContext('2d')!.putImageData(new ImageData(img.rgba, img.w, img.h), 0, 0);
  // WebP keeps the cache small; browsers without a WebP encoder return PNG
  return canvas.convertToBlob({ type: 'image/webp', quality: 0.9 });
}

/**
 * The sheet's relief layers as images (docs/PLAN.md, Etap 1, steps 2–4): LRM on a
 * diverging scale, 16-direction hillshade and Horn slope in grey. NODATA is transparent.
 */
export async function encodeReliefs(
  scene: Scene,
  nodata: (i: number) => boolean,
  onStep: (kind: ReliefKind) => void,
): Promise<ReliefImage[]> {
  const { w, h, cell, dem, lrm } = scene;
  const step = Math.ceil(Math.max(w, h) / MAX_SIDE);
  const res = cell * step;
  const out: ReliefImage[] = [];

  onStep('lrm');
  out.push({
    kind: 'lrm',
    res,
    blob: await encode(colorize(lrm, w, h, step, (v, i) => (nodata(i) ? null : lrmColor(v)))),
  });
  onStep('hillshade');
  const hs = hillshadeMulti(dem, w, h, cell);
  out.push({
    kind: 'hillshade',
    res,
    blob: await encode(
      colorize(hs, w, h, step, (v, i) => (nodata(i) ? null : grayColor(v, SHADE_LO, SHADE_HI))),
    ),
  });
  onStep('slope');
  const sl = slopeHorn(dem, w, h, cell);
  out.push({
    kind: 'slope',
    res,
    blob: await encode(
      colorize(sl, w, h, step, (v, i) => (nodata(i) ? null : grayColor(v, SLOPE_DARK_DEG, 0))),
    ),
  });
  return out;
}
