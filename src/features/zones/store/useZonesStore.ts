import { create } from 'zustand';
import { zonesRepo } from '@/shared/db';
import type { Zone } from '@/shared/types/domain';

interface ZonesState {
  zones: Zone[];
  load: () => Promise<void>;
  saveMany: (zones: Zone[]) => Promise<void>;
  save: (zone: Zone) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useZonesStore = create<ZonesState>((set) => ({
  zones: [],
  load: async () => set({ zones: await zonesRepo.getAll() }),
  saveMany: async (zones) => {
    await zonesRepo.putMany(zones);
    set({ zones: await zonesRepo.getAll() });
  },
  save: async (zone) => {
    await zonesRepo.put(zone);
    set((s) => ({ zones: [...s.zones.filter((z) => z.id !== zone.id), zone] }));
  },
  remove: async (id) => {
    await zonesRepo.remove(id);
    set((s) => ({ zones: s.zones.filter((z) => z.id !== id) }));
  },
}));
