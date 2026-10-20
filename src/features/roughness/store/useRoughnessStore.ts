import { create } from 'zustand';
import { useActivityStore } from '@/shared/store/useActivityStore';
import { useToastStore } from '@/shared/ui';
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
  /** stops waiting for the running analysis; what it still produces is thrown away */
  cancel: () => void;
  clear: () => void;
  setVisible: (visible: boolean) => void;
  setOpacity: (opacity: number) => void;
}

/** each run gets a number: a cancelled or older run's result is dropped */
let runNo = 0;

const stepOf = (progress: number) =>
  progress < 1 ? 'Pobieram cieniowanie NMT' : 'Analizuję i pomijam zabudowę';

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
    const no = ++runNo;
    set({ status: 'loading', progress: 0, error: null });
    useActivityStore.getState().upsert({
      id: 'roughness',
      label: 'Teren nierówny w widoku',
      short: 'Teren nierówny',
      share: 0,
      step: stepOf(0),
      cancel: () => get().cancel(),
      open: { mode: 'field', sheet: 'analyses', card: 'roughness' },
    });
    try {
      const result = await analyzeView(bounds, (progress) => {
        if (no !== runNo) return;
        set({ progress });
        useActivityStore
          .getState()
          .update('roughness', { share: progress < 1 ? progress : null, step: stepOf(progress) });
      });
      if (no !== runNo) {
        result.raster.image.close();
        return;
      }
      get().result?.raster.image.close();
      const newPlaces = await useAreasStore.getState().saveFromAnalysis(result.hotspots);
      set({ status: 'done', result, visible: true, newPlaces });
      useToastStore
        .getState()
        .show(`Oznaczono miejsc: ${result.hotspots.length} (nowych: ${newPlaces})`);
    } catch (e) {
      if (no !== runNo) return;
      set({ status: 'error', error: e instanceof Error ? e.message : 'Analiza nie powiodła się' });
    } finally {
      if (no === runNo) useActivityStore.getState().end('roughness');
    }
  },
  cancel: () => {
    if (get().status !== 'loading') return;
    runNo++;
    set({ status: get().result ? 'done' : 'idle', progress: 0 });
    useActivityStore.getState().end('roughness');
  },
  clear: () => {
    get().result?.raster.image.close();
    set({ status: 'idle', result: null, error: null });
  },
  setVisible: (visible) => set({ visible }),
  setOpacity: (opacity) => set({ opacity }),
}));
