import { getDb } from '../getDb';

export const photosRepo = {
  async get(id: string): Promise<Blob | undefined> {
    return (await getDb()).get('photos', id);
  },
  async getAllKeys(): Promise<string[]> {
    return (await getDb()).getAllKeys('photos');
  },
  async put(id: string, blob: Blob): Promise<void> {
    await (await getDb()).put('photos', blob, id);
  },
  async remove(id: string): Promise<void> {
    await (await getDb()).delete('photos', id);
  },
};
