import { create } from 'zustand';
import { analyzeView, type ViewBounds } from '../services/analyzeView';
import { useAreasStore } from './useAreasStore';
import type { RoughnessResult } from '../services/types';

interface RoughnessState {
  status: 'idle' | 'loading' | 'done' | 'error';
  /** 0–1 while fetching hillshade tiles */
  progress: number;
  error: string | null;
  result: RoughnessResult | null;
  /** places added by the last analysis */
  newPlaces: number;
  visible: boolean;
  opacity: number;
  run: (bounds: ViewBounds) => Promise<void>;
  clear: () => void;
  setVisible: (visible: boolean) => void;
  setOpacity: (opacity: number) => void;
}

export const useRoughnessStore = create<RoughnessState>((set, get) => ({
  status: 'idle',
  progress: 0,
  error: null,
  result: null,
  newPlaces: 0,
  visible: true,
  opacity: 0.8,
  run: async (bounds) => {
    if (get().status === 'loading') return;
    set({ status: 'loading', progress: 0, error: null });
    try {
      const result = await analyzeView(bounds, (progress) => set({ progress }));
      get().result?.raster.image.close();
      const newPlaces = await useAreasStore.getState().saveFromAnalysis(result.hotspots);
      set({ status: 'done', result, visible: true, newPlaces });
    } catch (e) {
      set({ status: 'error', error: e instanceof Error ? e.message : 'Analiza nie powiodła się' });
    }
  },
  clear: () => {
    get().result?.raster.image.close();
    set({ status: 'idle', result: null, error: null });
  },
  setVisible: (visible) => set({ visible }),
  setOpacity: (opacity) => set({ opacity }),
}));
