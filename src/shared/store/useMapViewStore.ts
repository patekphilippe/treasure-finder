import { create } from 'zustand';

interface LatLng {
  lat: number;
  lng: number;
}

export interface FlyTarget extends LatLng {
  zoom?: number;
  /** show the target this many pixels above the map centre (e.g. above a bottom sheet) */
  offsetY?: number;
}

interface MapViewState {
  center: LatLng;
  zoom: number;
  /** one-shot request for the map to fly somewhere; consumed by the map */
  flyTarget: FlyTarget | null;
  setView: (center: LatLng, zoom: number) => void;
  flyTo: (target: FlyTarget) => void;
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
