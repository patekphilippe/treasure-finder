import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { BaseLayerId } from '../config/baseLayers';
import { LAYER_SETTINGS_KEY } from '../config/storage';
import { browserStorage } from '../utils/browserStorage';

interface LayersState {
  baseLayer: BaseLayerId;
  nmtOn: boolean;
  /** search zones of accepted candidates */
  searchZonesOn: boolean;
  /** 0–1 */
  nmtOpacity: number;
  /** id from HISTORICAL_LAYERS, at most one at a time */
  historicalId: string | null;
  /** 0–1 */
  historicalOpacity: number;
  /** year for layers with a time dimension (archival orthophoto) */
  historicalYear: number;
  setBaseLayer: (id: BaseLayerId) => void;
  setNmtOn: (on: boolean) => void;
  setSearchZonesOn: (on: boolean) => void;
  setNmtOpacity: (opacity: number) => void;
  setHistoricalId: (id: string | null) => void;
  setHistoricalOpacity: (opacity: number) => void;
  setHistoricalYear: (year: number) => void;
}

export const useLayersStore = create<LayersState>()(
  persist(
    (set) => ({
      baseLayer: 'osm',
      nmtOn: false,
      nmtOpacity: 0.6,
      searchZonesOn: true,
      historicalId: null,
      historicalOpacity: 0.8,
      historicalYear: 2004,
      setBaseLayer: (baseLayer) => set({ baseLayer }),
      setNmtOn: (nmtOn) => set({ nmtOn }),
      setNmtOpacity: (nmtOpacity) => set({ nmtOpacity }),
      setSearchZonesOn: (searchZonesOn) => set({ searchZonesOn }),
      setHistoricalId: (historicalId) => set({ historicalId }),
      setHistoricalOpacity: (historicalOpacity) => set({ historicalOpacity }),
      setHistoricalYear: (historicalYear) => set({ historicalYear }),
    }),
    {
      name: LAYER_SETTINGS_KEY,
      storage: createJSONStorage(() => browserStorage() ?? sessionStorage),
      partialize: (s) => ({
        baseLayer: s.baseLayer,
        nmtOn: s.nmtOn,
        nmtOpacity: s.nmtOpacity,
        searchZonesOn: s.searchZonesOn,
        historicalId: s.historicalId,
        historicalOpacity: s.historicalOpacity,
        historicalYear: s.historicalYear,
      }),
    },
  ),
);
