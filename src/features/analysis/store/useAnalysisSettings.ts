import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_SETTINGS, type AnalysisSettings } from '@/shared/lib/detect';

interface SettingsState extends AnalysisSettings {
  set: (s: AnalysisSettings) => void;
}

/** LRM radius, threshold and score weights for the next analysis (persisted per device). */
export const useAnalysisSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      set: ({ lrmRadiusM, thresholdM, weights }) => set({ lrmRadiusM, thresholdM, weights }),
    }),
    {
      name: 'mapa.analysisSettings',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        lrmRadiusM: s.lrmRadiusM,
        thresholdM: s.thresholdM,
        weights: s.weights,
      }),
    },
  ),
);
