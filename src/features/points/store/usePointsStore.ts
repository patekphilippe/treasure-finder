import { create } from 'zustand';
import { photosRepo, pointsRepo } from '@/shared/db';
import type { FieldPoint } from '@/shared/types/domain';

interface PointsState {
  points: FieldPoint[];
  load: () => Promise<void>;
  save: (point: FieldPoint) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const usePointsStore = create<PointsState>((set, get) => ({
  points: [],
  load: async () => set({ points: await pointsRepo.getAll() }),
  save: async (point) => {
    await pointsRepo.put(point);
    set((s) => ({ points: [...s.points.filter((p) => p.id !== point.id), point] }));
  },
  remove: async (id) => {
    const point = get().points.find((p) => p.id === id);
    await pointsRepo.remove(id);
    if (point?.photoId) await photosRepo.remove(point.photoId);
    set((s) => ({ points: s.points.filter((p) => p.id !== id) }));
  },
}));
