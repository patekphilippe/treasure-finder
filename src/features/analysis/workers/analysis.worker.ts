/// <reference lib="webworker" />
// NMT interpretation runs here, never on the UI thread. Cancelling = worker.terminate().
import { analyseSheet } from '@/shared/lib/detect';
import { readAsc, readGeoTiff, type DemGrid } from '@/shared/lib/raster';
import { fetchBuildingMask } from '@/shared/lib/tiles';
import { sheetIdFromName } from '../utils/sheetIdFromName';
import type { AnalysisRequest, AnalysisResponse } from './messages';

declare const self: DedicatedWorkerGlobalScope;

const reply = (msg: AnalysisResponse) => self.postMessage(msg);

self.onmessage = async (event: MessageEvent<AnalysisRequest>) => {
  const { name, buffer, context, water, excludeBuildings } = event.data;
  try {
    reply({ type: 'progress', share: 0.01, step: 'Wczytywanie arkusza' });
    const grid: DemGrid = /\.tiff?$/i.test(name) ? await readGeoTiff(buffer) : readAsc(buffer);
    let exclude: Uint8Array | undefined;
    if (excludeBuildings) {
      reply({ type: 'progress', share: 0.03, step: 'Pobieranie zabudowy (BDOT10k)' });
      exclude = await fetchBuildingMask(grid.originE, grid.originN, grid.cell, grid.w, grid.h);
    }
    const sheetId = sheetIdFromName(name);
    const candidates = analyseSheet(grid, {
      sheetId,
      context,
      water,
      exclude,
      onProgress: (share, step) => reply({ type: 'progress', share: 0.05 + share * 0.95, step }),
    });
    reply({
      type: 'done',
      sheet: {
        sheetId,
        cell: grid.cell,
        cols: grid.w,
        rows: grid.h,
        originE: grid.originE,
        originN: grid.originN,
      },
      candidates,
    });
  } catch (e) {
    reply({ type: 'error', message: e instanceof Error ? e.message : 'Analiza nie powiodła się' });
  }
};
