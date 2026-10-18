import { historicalWmsParams } from '@/features/layers';
import { crsTransform, toEpsg2180 } from '@/shared/lib/geo';
import { imageToTileAffine, invertHomography } from '@/shared/lib/georef';
import type { ImageGrid } from '@/shared/lib/history';
import type { Bounds } from '@/shared/store/useMapViewStore';
import type { OwnMap } from '@/shared/types/domain';
import { AI_MAX_RES_M, AI_MAX_SIDE } from '../config/aiReading';

type WmsLayer = Parameters<typeof historicalWmsParams>[0];

/** a busy ArcGIS server answers 400 and then serves the same image */
const RETRY_DELAYS_MS = [1000, 2500, 5000];

async function fetchWithRetry(url: string): Promise<Blob> {
  for (let n = 0; ; n++) {
    const response = await fetch(n ? `${url}&_retry=${n}` : url).catch(() => null);
    if (response?.ok) return response.blob();
    if (n >= RETRY_DELAYS_MS.length)
      throw new Error('Serwer mapy historycznej nie odpowiedział, spróbuj za chwilę');
    await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[n]));
  }
}

export type ViewSource =
  | { kind: 'own'; map: OwnMap; label: string }
  | { kind: 'wms'; layer: WmsLayer; year: number; label: string };

/**
 * The visible part of a historical map as one image on the EPSG:2180 grid: an own map is warped
 * locally, an online map is asked once (one GetMap for the view, not a tile download).
 */
export async function captureView(
  bounds: Bounds,
  source: ViewSource,
): Promise<{ image: Blob; grid: ImageGrid }> {
  const pts = [
    toEpsg2180(bounds.north, bounds.west),
    toEpsg2180(bounds.north, bounds.east),
    toEpsg2180(bounds.south, bounds.west),
    toEpsg2180(bounds.south, bounds.east),
  ];
  const minE = Math.min(...pts.map((p) => p[0]));
  const maxE = Math.max(...pts.map((p) => p[0]));
  const minN = Math.min(...pts.map((p) => p[1]));
  const maxN = Math.max(...pts.map((p) => p[1]));
  const res = Math.max(maxE - minE, maxN - minN) / AI_MAX_SIDE;
  if (res > AI_MAX_RES_M)
    throw new Error(
      `Przybliż mapę: widok ma ${((maxE - minE) / 1000).toFixed(1)} km, domy byłyby za małe do odczytania`,
    );
  const w = Math.ceil((maxE - minE) / res);
  const h = Math.ceil((maxN - minN) / res);
  const grid: ImageGrid = { originE: minE, originN: maxN, res, w, h };

  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  if (source.kind === 'own') {
    const crs = crsTransform(source.map.epsg);
    if (!crs) throw new Error('Nieznany układ mapy');
    const bitmap = await createImageBitmap(source.map.image);
    const corner = (x: number, y: number) => ({ x: minE + x * res, y: maxN - y * res });
    const m = imageToTileAffine(
      [corner(0, 0), corner(w, 0), corner(0, h)],
      invertHomography(source.map.pixelToSource),
      crs,
      w,
      h,
    );
    ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
    ctx.drawImage(bitmap, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    bitmap.close();
  } else {
    const q = new URLSearchParams({
      SERVICE: 'WMS',
      VERSION: '1.3.0',
      REQUEST: 'GetMap',
      LAYERS: source.layer.layers,
      STYLES: '',
      CRS: 'EPSG:2180',
      BBOX: [maxN - h * res, minE, maxN, minE + w * res].map((v) => v.toFixed(2)).join(','),
      WIDTH: String(w),
      HEIGHT: String(h),
      FORMAT: 'image/png',
      ...historicalWmsParams(source.layer, source.year),
    });
    const bitmap = await createImageBitmap(
      await fetchWithRetry(`${source.layer.url}?${q.toString()}`),
    );
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
  }
  return { image: await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 }), grid };
}
