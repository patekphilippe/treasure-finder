import type { FieldPoint } from '@/shared/types/domain';
import { getDb } from '../getDb';

export const pointsRepo = {
  async getAll(): Promise<FieldPoint[]> {
    return (await getDb()).getAll('points');
  },
  async get(id: string): Promise<FieldPoint | undefined> {
    return (await getDb()).get('points', id);
  },
  async put(point: FieldPoint): Promise<void> {
    await (await getDb()).put('points', point);
  },
  async putMany(points: FieldPoint[]): Promise<void> {
    const tx = (await getDb()).transaction('points', 'readwrite');
    await Promise.all([...points.map((p) => tx.store.put(p)), tx.done]);
  },
  async remove(id: string): Promise<void> {
    await (await getDb()).delete('points', id);
  },
};
