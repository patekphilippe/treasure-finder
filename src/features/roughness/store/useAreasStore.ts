import { create } from 'zustand';
import { areasRepo } from '@/shared/db';
import { createId } from '@/shared/lib/createId';
import type { AreaCategory, RoughArea } from '@/shared/types/domain';
import type { RoughnessHotspot } from '../services/types';
import { mergeAreas } from '../utils/mergeAreas';

interface AreasState {
  areas: RoughArea[];
  /** show the numbered markers on the map */
  visible: boolean;
  load: () => Promise<void>;
  /** saves the areas of an analysis as places; returns how many are new */
  saveFromAnalysis: (found: readonly RoughnessHotspot[]) => Promise<number>;
  update: (area: RoughArea) => Promise<void>;
  setCategory: (id: string, category: AreaCategory) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setVisible: (visible: boolean) => void;
}

export const useAreasStore = create<AreasState>((set, get) => ({
  areas: [],
  visible: true,
  load: async () => set({ areas: await areasRepo.getAll() }),
  saveFromAnalysis: async (found) => {
    const before = get().areas;
    const merged = mergeAreas(before, found, Date.now(), createId);
    await areasRepo.putMany(merged);
    const all = await areasRepo.getAll();
    set({ areas: all });
    return all.length - before.length;
  },
  update: async (area) => {
    await areasRepo.put(area);
    set((s) => ({ areas: s.areas.map((a) => (a.id === area.id ? area : a)) }));
  },
  setCategory: async (id, category) => {
    const area = get().areas.find((a) => a.id === id);
    if (area) await get().update({ ...area, category, auto: false, updated: Date.now() });
  },
  remove: async (id) => {
    await areasRepo.remove(id);
    set((s) => ({ areas: s.areas.filter((a) => a.id !== id) }));
  },
  setVisible: (visible) => set({ visible }),
}));
