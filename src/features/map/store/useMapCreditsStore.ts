import { create } from 'zustand';

interface MapCreditsState {
  /** credits (HTML from the layers' `attribution`) of the layers on the map now */
  credits: string[];
  open: boolean;
  setCredits: (credits: string[]) => void;
  setOpen: (open: boolean) => void;
}

/** Map data credits behind the ⓘ next to the GPS chip (components/MapCredits.tsx). */
export const useMapCreditsStore = create<MapCreditsState>()((set) => ({
  credits: [],
  // open when the map appears: the OSM guidelines let them fold after 5 s or at the first touch
  open: true,
  setCredits: (credits) => set({ credits }),
  setOpen: (open) => set({ open }),
}));
