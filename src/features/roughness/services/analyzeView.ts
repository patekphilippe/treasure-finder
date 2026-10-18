import { NMT_WMTS_2180 } from '@/shared/config/geoportalWmts2180';
import { fromEpsg2180, toEpsg2180 } from '@/shared/lib/geo';
import { fetchBuildingMask, sourceTileRange } from '@/shared/lib/tiles';
import { HOTSPOT_LIST_LIMIT, LEVELS, MAX_TILES } from '../config/roughness';
import type { RoughnessRequest, RoughnessResponse } from '../workers/messages';
import { ViewTooLargeError, type RoughnessResult } from './types';

export interface ViewBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

const cfg = NMT_WMTS_2180;

function loadTile(level: number, row: number, col: number): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Geoportal allows CORS, so the pixels can be read
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src =
      `${cfg.url}?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${cfg.layer}&STYLE=default` +
      `&TILEMATRIXSET=EPSG:2180&TILEMATRIX=EPSG:2180:${level}&TILEROW=${row}&TILECOL=${col}` +
      `&FORMAT=${encodeURIComponent(cfg.format)}`;
  });
}

function runWorker(request: RoughnessRequest): Promise<RoughnessResponse> {
  const worker = new Worker(new URL('../workers/roughness.worker.ts', import.meta.url), {
    type: 'module',
  });
  return new Promise((resolve, reject) => {
    worker.onmessage = (e: MessageEvent<RoughnessResponse>) => {
      resolve(e.data);
      worker.terminate();
    };
    worker.onerror = (e) => {
      reject(new Error(e.message));
      worker.terminate();
    };
    worker.postMessage(request, [request.gray.buffer, request.valid.buffer]);
  });
}

/**
 * Fetches the Geoportal hillshade for the visible area (EPSG:2180 WMTS), runs the
 * roughness analysis in a worker and returns the heat image plus the strongest areas.
 */
export async function analyzeView(
  bounds: ViewBounds,
  onProgress: (share: number) => void,
): Promise<RoughnessResult> {
  const corners = [
    toEpsg2180(bounds.north, bounds.west),
    toEpsg2180(bounds.north, bounds.east),
    toEpsg2180(bounds.south, bounds.west),
    toEpsg2180(bounds.south, bounds.east),
  ];
  const bbox = {
    minE: Math.min(...corners.map((c) => c[0])),
    maxE: Math.max(...corners.map((c) => c[0])),
    minN: Math.min(...corners.map((c) => c[1])),
    maxN: Math.max(...corners.map((c) => c[1])),
  };

  let picked: { level: number; range: NonNullable<ReturnType<typeof sourceTileRange>> } | null =
    null;
  for (const level of LEVELS) {
    const span = cfg.tileSize * cfg.resolutions[level]!;
    const range = sourceTileRange(
      bbox,
      cfg.originEasting,
      cfg.originNorthing,
      span,
      cfg.matrixSize[level]!,
    );
    if (range && (range.col1 - range.col0 + 1) * (range.row1 - range.row0 + 1) <= MAX_TILES) {
      picked = { level, range };
      break;
    }
  }
  if (!picked) throw new ViewTooLargeError('Przybliż mapę. Analizuję obszar do ok. 8 × 8 km');

  const { level, range } = picked;
  const res = cfg.resolutions[level]!;
  const cols = range.col1 - range.col0 + 1;
  const rows = range.row1 - range.row0 + 1;
  const ts = cfg.tileSize;
  const canvas = new OffscreenCanvas(cols * ts, rows * ts);
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  let done = 0;
  const total = cols * rows;
  await Promise.all(
    Array.from({ length: total }, async (_, k) => {
      const row = range.row0 + Math.floor(k / cols);
      const col = range.col0 + (k % cols);
      const img = await loadTile(level, row, col);
      if (img) ctx.drawImage(img, (col - range.col0) * ts, (row - range.row0) * ts);
      onProgress(++done / total);
    }),
  );

  const { data, width: w, height: h } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const originE = cfg.originEasting + range.col0 * ts * res;
  const originN = cfg.originNorthing - range.row0 * ts * res;
  const built = await fetchBuildingMask(originE, originN, res, w, h);
  const gray = new Float32Array(w * h);
  const valid = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = data[i * 4]!;
    const g = data[i * 4 + 1]!;
    const b = data[i * 4 + 2]!;
    const a = data[i * 4 + 3]!;
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    // blank = no NMT; buildings and yards are not analysed (bumps left by removed buildings)
    valid[i] = a > 0 && !(r > 250 && g > 250 && b > 250) && !built[i] ? 1 : 0;
  }

  const reply = await runWorker({ gray, valid, w, h, res });
  const image = await createImageBitmap(new ImageData(reply.rgba, w, h));
  const top = reply.hotspots.slice(0, HOTSPOT_LIST_LIMIT).map((s) => {
    const [lat, lng] = fromEpsg2180(originE + (s.col + 0.5) * res, originN - (s.row + 0.5) * res);
    return {
      lat,
      lng,
      areaM2: s.areaPx * res * res,
      strength: Math.round(s.meanScore * 100),
      elongation: s.elongation,
    };
  });
  return { raster: { image, originE, originN, res }, hotspots: top, analysedAt: Date.now() };
}
