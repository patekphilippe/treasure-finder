import { readFloatTiff } from '@/shared/lib/raster/readFloatTiff';
import { NMT_COVERAGE_ID, NMT_TIMEOUT_MS, NMT_WCS_URL } from './config';
import type { DemWindow } from './demWindow';

/** GetCoverage URL of the window: x is easting and y northing in this service (checked on Śnieżka). */
export function wcsUrl(win: DemWindow, base = NMT_WCS_URL): string {
  const e1 = win.e0 + win.w * win.cell;
  const n0 = win.n1 - win.h * win.cell;
  const params = [
    'SERVICE=WCS',
    'REQUEST=GetCoverage',
    'VERSION=2.0.1',
    `COVERAGEID=${NMT_COVERAGE_ID}`,
    `SUBSET=x(${win.e0.toFixed(2)},${e1.toFixed(2)})`,
    `SUBSET=y(${n0.toFixed(2)},${win.n1.toFixed(2)})`,
    `SCALESIZE=x(${win.w}),y(${win.h})`,
    'FORMAT=image/tiff',
  ];
  // shrinking: the mean of the cells, not every n-th one (no aliasing)
  if (win.cell > 1.25) params.push('INTERPOLATION=AVERAGE');
  return `${base}?${params.join('&')}`;
}

/**
 * Heights of the window from the GUGiK WCS (one retry: the service now and then drops a
 * connection). Outside Poland it answers 0 m, which becomes NaN here.
 */
export async function fetchDem(win: DemWindow, base = NMT_WCS_URL): Promise<Float32Array> {
  let last: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(wcsUrl(win, base), { signal: AbortSignal.timeout(NMT_TIMEOUT_MS) });
      if (!res.ok || !(res.headers.get('content-type') ?? '').includes('tiff'))
        throw new Error(`WCS ${res.status}`);
      const tiff = readFloatTiff(await res.arrayBuffer());
      if (tiff.w !== win.w || tiff.h !== win.h)
        throw new Error(`WCS dał ${tiff.w}×${tiff.h} zamiast ${win.w}×${win.h}`);
      for (let i = 0; i < tiff.data.length; i++) if (tiff.data[i] === 0) tiff.data[i] = NaN;
      return tiff.data;
    } catch (e) {
      last = e;
    }
  }
  throw last instanceof Error ? last : new Error('WCS nie odpowiada');
}
