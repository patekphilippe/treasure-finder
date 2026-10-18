/// <reference lib="webworker" />
// NMT interpretation runs here, never on the UI thread. Cancelling = worker.terminate().
import { analyseSheet, withParams, type Scene } from '@/shared/lib/detect';
import { readAsc, readGeoTiff, type DemGrid } from '@/shared/lib/raster';
import { fetchExclusionMask } from '@/shared/lib/tiles';
import { sheetIdFromName } from '../utils/sheetIdFromName';
import { encodeReliefs } from './encodeReliefs';
import type { AnalysisRequest, AnalysisResponse } from './messages';

declare const self: DedicatedWorkerGlobalScope;

const reply = (msg: AnalysisResponse, transfer: Transferable[] = []) =>
  self.postMessage(msg, transfer);

self.onmessage = async (event: MessageEvent<AnalysisRequest>) => {
  const { name, buffer, context, water, forbidden, excludeBuildings, settings } = event.data;
  try {
    reply({ type: 'progress', share: 0.01, step: 'Wczytywanie arkusza' });
    const grid: DemGrid = /\.tiff?$/i.test(name) ? await readGeoTiff(buffer) : readAsc(buffer);
    let exclusion: Awaited<ReturnType<typeof fetchExclusionMask>> | null = null;
    if (excludeBuildings) {
      reply({ type: 'progress', share: 0.03, step: 'Pobieranie zabudowy, dróg i wód (BDOT10k)' });
      exclusion = await fetchExclusionMask(grid.originE, grid.originN, grid.cell, grid.w, grid.h);
    }
    const sheetId = sheetIdFromName(name);
    let scene: Scene | null = null;
    const candidates = analyseSheet(
      grid,
      {
        sheetId,
        context,
        water,
        forbidden,
        exclude: exclusion?.mask,
        onProgress: (share, step) => reply({ type: 'progress', share: 0.05 + share * 0.85, step }),
        onScene: (s) => {
          scene = s;
        },
      },
      withParams(settings),
    );
    const steps = {
      lrm: 'Warstwa LRM',
      hillshade: 'Cieniowanie z 16 kierunków',
      slope: 'Nachylenie',
    };
    const shares = { lrm: 0.91, hillshade: 0.94, slope: 0.97 };
    const reliefs = scene
      ? await encodeReliefs(
          scene,
          (i) => Number.isNaN(grid.dem[i]!),
          (kind) => reply({ type: 'progress', share: shares[kind], step: steps[kind] }),
        )
      : [];
    reply(
      {
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
        exclusion,
        reliefs,
      },
      exclusion ? [exclusion.mask.buffer] : [],
    );
  } catch (e) {
    reply({ type: 'error', message: e instanceof Error ? e.message : 'Analiza nie powiodła się' });
  }
};
