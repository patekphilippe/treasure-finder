import { create } from 'zustand';

export type DraftSource = 'gps' | 'crosshair' | 'map';

interface PointDraftState {
  source: DraftSource;
  /** chosen location for crosshair / map sources */
  location: { lat: number; lng: number } | null;
  /** crosshair mode: the sheet collapses so the map centre is visible */
  picking: boolean;
  setSource: (source: DraftSource) => void;
  startPicking: () => void;
  finishPicking: (lat: number, lng: number) => void;
  placeFromMap: (lat: number, lng: number) => void;
  reset: () => void;
}

const INITIAL = { source: 'gps' as DraftSource, location: null, picking: false };

export const usePointDraftStore = create<PointDraftState>((set) => ({
  ...INITIAL,
  setSource: (source) => set({ source, location: null, picking: false }),
  startPicking: () => set({ source: 'crosshair', picking: true }),
  finishPicking: (lat, lng) => set({ source: 'crosshair', location: { lat, lng }, picking: false }),
  placeFromMap: (lat, lng) => set({ source: 'map', location: { lat, lng }, picking: false }),
  reset: () => set(INITIAL),
}));
