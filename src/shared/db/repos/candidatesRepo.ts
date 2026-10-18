import type { Candidate } from '@/shared/types/domain';
import { getDb } from '../getDb';

export const candidatesRepo = {
  async getAll(): Promise<Candidate[]> {
    return (await getDb()).getAll('candidates');
  },
  async getBySheet(sheetId: string): Promise<Candidate[]> {
    return (await getDb()).getAllFromIndex('candidates', 'bySheet', sheetId);
  },
  async put(candidate: Candidate): Promise<void> {
    await (await getDb()).put('candidates', candidate);
  },
  async putMany(candidates: Candidate[]): Promise<void> {
    const tx = (await getDb()).transaction('candidates', 'readwrite');
    await Promise.all([...candidates.map((c) => tx.store.put(c)), tx.done]);
  },
  async removeMany(ids: string[]): Promise<void> {
    const tx = (await getDb()).transaction('candidates', 'readwrite');
    await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
  },
  async clear(): Promise<void> {
    await (await getDb()).clear('candidates');
  },
};
