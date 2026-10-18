import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CustomLayer } from '@/shared/types/domain';
import type { BaseLayerId } from '../config/baseLayers';
import { LAYER_SETTINGS_KEY } from '../config/storage';
import { browserStorage } from '../utils/browserStorage';
import { loadCustomLayers } from '../utils/loadCustomLayers';
import { saveCustomLayers } from '../utils/saveCustomLayers';

interface LayersState {
  baseLayer: BaseLayerId;
  nmtOn: boolean;
  /** search zones of accepted candidates */
  searchZonesOn: boolean;
  /** 0–1 */
  nmtOpacity: number;
  /** kept in their own localStorage key as a plain CustomLayer[] */
  customLayers: CustomLayer[];
  setBaseLayer: (id: BaseLayerId) => void;
  setNmtOn: (on: boolean) => void;
  setSearchZonesOn: (on: boolean) => void;
  setNmtOpacity: (opacity: number) => void;
  addCustomLayer: (layer: CustomLayer) => void;
  updateCustomLayer: (id: string, patch: Partial<CustomLayer>) => void;
  removeCustomLayer: (id: string) => void;
}

export const useLayersStore = create<LayersState>()(
  persist(
    (set, get) => {
      const commit = (customLayers: CustomLayer[]) => {
        saveCustomLayers(customLayers, browserStorage());
        set({ customLayers });
      };
      return {
        baseLayer: 'osm',
        nmtOn: false,
        nmtOpacity: 0.6,
        searchZonesOn: true,
        customLayers: loadCustomLayers(browserStorage()),
        setBaseLayer: (baseLayer) => set({ baseLayer }),
        setNmtOn: (nmtOn) => set({ nmtOn }),
        setNmtOpacity: (nmtOpacity) => set({ nmtOpacity }),
        setSearchZonesOn: (searchZonesOn) => set({ searchZonesOn }),
        addCustomLayer: (layer) => commit([...get().customLayers, layer]),
        updateCustomLayer: (id, patch) =>
          commit(get().customLayers.map((l) => (l.id === id ? { ...l, ...patch } : l))),
        removeCustomLayer: (id) => commit(get().customLayers.filter((l) => l.id !== id)),
      };
    },
    {
      name: LAYER_SETTINGS_KEY,
      storage: createJSONStorage(() => browserStorage() ?? sessionStorage),
      partialize: (s) => ({
        baseLayer: s.baseLayer,
        nmtOn: s.nmtOn,
        nmtOpacity: s.nmtOpacity,
        searchZonesOn: s.searchZonesOn,
      }),
    },
  ),
);
