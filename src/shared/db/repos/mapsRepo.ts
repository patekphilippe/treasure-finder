import type { OwnMap } from '@/shared/types/domain';
import { getDb } from '../getDb';

export const mapsRepo = {
  async getAll(): Promise<OwnMap[]> {
    return (await getDb()).getAll('maps');
  },
  async put(map: OwnMap): Promise<void> {
    await (await getDb()).put('maps', map);
  },
  async remove(id: string): Promise<void> {
    await (await getDb()).delete('maps', id);
  },
};
