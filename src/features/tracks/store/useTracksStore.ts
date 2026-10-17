import { create } from 'zustand';
import { tracksRepo } from '@/shared/db';
import type { Track } from '@/shared/types/domain';

interface TracksState {
  tracks: Track[];
  load: () => Promise<void>;
  /** Insert or replace in memory only (persistence is the caller's job). */
  upsert: (track: Track) => void;
  remove: (id: string) => Promise<void>;
}

export const useTracksStore = create<TracksState>((set) => ({
  tracks: [],
  load: async () => {
    const tracks = await tracksRepo.getAll();
    set({ tracks: tracks.sort((a, b) => b.start - a.start) });
  },
  upsert: (track) =>
    set((s) => {
      const rest = s.tracks.filter((t) => t.id !== track.id);
      return { tracks: [track, ...rest].sort((a, b) => b.start - a.start) };
    }),
  remove: async (id) => {
    await tracksRepo.remove(id);
    set((s) => ({ tracks: s.tracks.filter((t) => t.id !== id) }));
  },
}));
