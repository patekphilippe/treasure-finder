import { create } from 'zustand';
import type { BaseLayerId } from '../config/baseLayers';

interface LayersState {
  baseLayer: BaseLayerId;
  nmtOn: boolean;
  /** 0–1 */
  nmtOpacity: number;
  setBaseLayer: (id: BaseLayerId) => void;
  setNmtOn: (on: boolean) => void;
  setNmtOpacity: (opacity: number) => void;
}

export const useLayersStore = create<LayersState>((set) => ({
  baseLayer: 'osm',
  nmtOn: false,
  nmtOpacity: 0.6,
  setBaseLayer: (baseLayer) => set({ baseLayer }),
  setNmtOn: (nmtOn) => set({ nmtOn }),
  setNmtOpacity: (nmtOpacity) => set({ nmtOpacity }),
}));
