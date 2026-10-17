import type { Track } from '@/shared/types/domain';
import { getDb } from '../getDb';

export const tracksRepo = {
  async getAll(): Promise<Track[]> {
    return (await getDb()).getAll('tracks');
  },
  async get(id: string): Promise<Track | undefined> {
    return (await getDb()).get('tracks', id);
  },
  /** The track that was being recorded when the app was last closed, if any. */
  async getActive(): Promise<Track | undefined> {
    const all = await (await getDb()).getAll('tracks');
    return all.find((t) => t.active);
  },
  async put(track: Track): Promise<void> {
    await (await getDb()).put('tracks', track);
  },
  async putMany(tracks: Track[]): Promise<void> {
    const tx = (await getDb()).transaction('tracks', 'readwrite');
    await Promise.all([...tracks.map((t) => tx.store.put(t)), tx.done]);
  },
  async remove(id: string): Promise<void> {
    await (await getDb()).delete('tracks', id);
  },
};
