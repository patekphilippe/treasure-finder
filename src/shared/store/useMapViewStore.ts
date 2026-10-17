import { create } from 'zustand';

interface MapViewState {
  center: { lat: number; lng: number };
  zoom: number;
  setView: (center: { lat: number; lng: number }, zoom: number) => void;
}

export const useMapViewStore = create<MapViewState>((set) => ({
  center: { lat: 52.1, lng: 19.4 },
  zoom: 6,
  setView: (center, zoom) => set({ center, zoom }),
}));
