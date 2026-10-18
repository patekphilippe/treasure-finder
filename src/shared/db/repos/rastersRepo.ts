import type { RasterRecord } from '@/shared/types/domain';
import { getDb } from '../getDb';

export const rastersRepo = {
  async getAll(): Promise<RasterRecord[]> {
    return (await getDb()).getAll('rasters');
  },
  /** replaces the sheet's rasters with these */
  async replaceSheet(sheetId: string, records: RasterRecord[]): Promise<void> {
    const db = await getDb();
    const old = await db.getAllKeysFromIndex('rasters', 'bySheet', sheetId);
    const tx = db.transaction('rasters', 'readwrite');
    await Promise.all([
      ...old.map((k) => tx.store.delete(k)),
      ...records.map((r) => tx.store.put(r)),
      tx.done,
    ]);
  },
};
