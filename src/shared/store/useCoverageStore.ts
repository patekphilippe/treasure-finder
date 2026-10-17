import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const SWATH_MIN_M = 0.3;
export const SWATH_MAX_M = 3;

interface CoverageState {
  /** width of the strip one pass searches, metres (detector coil sweep) */
  swathM: number;
  /** draw tracks as searched strips instead of thin lines */
  showCoverage: boolean;
  setSwathM: (m: number) => void;
  setShowCoverage: (on: boolean) => void;
}

export const useCoverageStore = create<CoverageState>()(
  persist(
    (set) => ({
      swathM: 1,
      showCoverage: false,
      setSwathM: (m) => set({ swathM: Math.min(SWATH_MAX_M, Math.max(SWATH_MIN_M, m)) }),
      setShowCoverage: (showCoverage) => set({ showCoverage }),
    }),
    { name: 'mapa.coverage', storage: createJSONStorage(() => localStorage) },
  ),
);
