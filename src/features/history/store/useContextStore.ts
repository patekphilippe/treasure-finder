import { create } from 'zustand';
import { contextRepo } from '@/shared/db';
import type { ContextFeature } from '@/shared/types/domain';

interface ContextState {
  /** archival objects in IndexedDB; they raise the score of nearby NMT candidates */
  features: ContextFeature[];
  visible: boolean;
  /** dim the objects not seen on the visible historical map (they still count in the analysis) */
  onlyViewMap: boolean;
  load: () => Promise<void>;
  add: (features: ContextFeature[]) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setVisible: (visible: boolean) => void;
  setOnlyViewMap: (onlyViewMap: boolean) => void;
}

export const useContextStore = create<ContextState>()((set, get) => ({
  features: [],
  visible: true,
  onlyViewMap: false,
  load: async () => set({ features: await contextRepo.getAll() }),
  add: async (features) => {
    await contextRepo.putMany(features);
    const ids = new Set(features.map((f) => f.id));
    set({ features: [...get().features.filter((f) => !ids.has(f.id)), ...features] });
  },
  remove: async (id) => {
    await contextRepo.remove(id);
    set({ features: get().features.filter((f) => f.id !== id) });
  },
  setVisible: (visible) => set({ visible }),
  setOnlyViewMap: (onlyViewMap) => set({ onlyViewMap }),
}));
