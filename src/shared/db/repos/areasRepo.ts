import type { RoughArea } from '@/shared/types/domain';
import { getDb } from '../getDb';

export const areasRepo = {
  async getAll(): Promise<RoughArea[]> {
    return (await getDb()).getAll('areas');
  },
  async put(area: RoughArea): Promise<void> {
    await (await getDb()).put('areas', area);
  },
  async putMany(areas: RoughArea[]): Promise<void> {
    const tx = (await getDb()).transaction('areas', 'readwrite');
    await Promise.all([...areas.map((a) => tx.store.put(a)), tx.done]);
  },
  async remove(id: string): Promise<void> {
    await (await getDb()).delete('areas', id);
  },
};
