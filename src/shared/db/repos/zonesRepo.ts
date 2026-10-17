import type { Zone } from '@/shared/types/domain';
import { getDb } from '../getDb';

export const zonesRepo = {
  async getAll(): Promise<Zone[]> {
    return (await getDb()).getAll('zones');
  },
  async put(zone: Zone): Promise<void> {
    await (await getDb()).put('zones', zone);
  },
  async putMany(zones: Zone[]): Promise<void> {
    const tx = (await getDb()).transaction('zones', 'readwrite');
    await Promise.all([...zones.map((z) => tx.store.put(z)), tx.done]);
  },
  async remove(id: string): Promise<void> {
    await (await getDb()).delete('zones', id);
  },
};
