import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { rastersRepo } from '@/shared/db';
import type { RasterRecord, ReliefKind } from '@/shared/types/domain';

interface ReliefState {
  /** relief layer of the loaded sheets drawn on the map, or none */
  kind: ReliefKind | null;
  opacity: number;
  records: RasterRecord[];
  setKind: (kind: ReliefKind | null) => void;
  setOpacity: (opacity: number) => void;
  load: () => Promise<void>;
}

export const useReliefStore = create<ReliefState>()(
  persist(
    (set) => ({
      kind: null,
      opacity: 0.7,
      records: [],
      setKind: (kind) => set({ kind }),
      setOpacity: (opacity) => set({ opacity }),
      load: async () => {
        const records = await rastersRepo.getAll();
        set({ records: records.filter((r) => r.data instanceof Blob) });
      },
    }),
    {
      name: 'mapa.relief',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ kind: s.kind, opacity: s.opacity }),
    },
  ),
);
