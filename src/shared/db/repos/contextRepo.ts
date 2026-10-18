import type { ContextFeature } from '@/shared/types/domain';
import { getDb } from '../getDb';

export const contextRepo = {
  async getAll(): Promise<ContextFeature[]> {
    return (await getDb()).getAll('context');
  },
  async putMany(features: ContextFeature[]): Promise<void> {
    const tx = (await getDb()).transaction('context', 'readwrite');
    await Promise.all([...features.map((f) => tx.store.put(f)), tx.done]);
  },
  async remove(id: string): Promise<void> {
    await (await getDb()).delete('context', id);
  },
};
