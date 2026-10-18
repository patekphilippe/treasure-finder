import { create } from 'zustand';
import { createId } from '@/shared/lib/createId';
import type { Bounds } from '@/shared/store/useMapViewStore';
import { AREA_CACHE_PREFIX } from '../config/offlineAreas';
import type { OfflineArea } from '../types';
import { downloadArea, type DownloadResult } from '../utils/downloadArea';
import { listAreas } from '../utils/listAreas';

export interface LayerChoice {
  ortho: boolean;
  nmt: boolean;
  topo: boolean;
  /** ids of custom XYZ layers */
  custom: string[];
}

interface OfflineState {
  areas: OfflineArea[];
  /** the frame is on the map */
  selecting: boolean;
  /** what the frame covers right now */
  selection: Bounds | null;
  layers: LayerChoice;
  progress: { done: number; total: number } | null;
  abort: AbortController | null;
  load: () => Promise<void>;
  startSelecting: () => void;
  preselectBase: (base: 'osm' | 'ortho' | 'topo') => void;
  stopSelecting: () => void;
  setSelection: (b: Bounds | null) => void;
  setLayers: (patch: Partial<LayerChoice>) => void;
  download: (urls: string[], layerNames: string[]) => Promise<DownloadResult>;
  cancelDownload: () => void;
  remove: (id: string) => Promise<void>;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  areas: [],
  selecting: false,
  selection: null,
  layers: { ortho: true, nmt: true, topo: false, custom: [] },
  progress: null,
  abort: null,
  load: async () => set({ areas: await listAreas() }),
  startSelecting: () => set({ selecting: true }),
  /** preselect the base layer the user looks at */
  preselectBase: (base) =>
    set((s) => ({ layers: { ...s.layers, ortho: base !== 'topo', topo: base === 'topo' } })),
  stopSelecting: () => set({ selecting: false, selection: null }),
  setSelection: (selection) => set({ selection }),
  setLayers: (patch) => set((s) => ({ layers: { ...s.layers, ...patch } })),
  download: async (urls, layerNames) => {
    const { selection, areas } = get();
    if (!selection) throw new Error('Brak obszaru');
    const abort = new AbortController();
    set({ abort, progress: { done: 0, total: urls.length } });
    try {
      const area = {
        id: createId(),
        name: `Obszar ${areas.length + 1}`,
        created: new Date().toISOString(),
        bounds: selection,
        layers: layerNames,
        tiles: urls.length,
      };
      const result = await downloadArea(
        area,
        urls,
        (done) => set({ progress: { done, total: urls.length } }),
        abort.signal,
      );
      await get().load();
      set({ selecting: false, selection: null });
      return result;
    } finally {
      set({ abort: null, progress: null });
    }
  },
  cancelDownload: () => get().abort?.abort(),
  remove: async (id) => {
    await caches.delete(AREA_CACHE_PREFIX + id);
    await get().load();
  },
}));
