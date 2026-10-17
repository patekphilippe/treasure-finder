import { create } from 'zustand';

interface LatLng {
  lat: number;
  lng: number;
}

interface MapViewState {
  center: LatLng;
  zoom: number;
  /** one-shot request for the map to fly somewhere; consumed by the map */
  flyTarget: (LatLng & { zoom?: number }) | null;
  setView: (center: LatLng, zoom: number) => void;
  flyTo: (target: LatLng & { zoom?: number }) => void;
  clearFly: () => void;
}

export const useMapViewStore = create<MapViewState>((set) => ({
  center: { lat: 52.1, lng: 19.4 },
  zoom: 6,
  flyTarget: null,
  setView: (center, zoom) => set({ center, zoom }),
  flyTo: (flyTarget) => set({ flyTarget }),
  clearFly: () => set({ flyTarget: null }),
}));
