import { getDb } from '@/shared/db';

/** Empties every store so each test starts from a clean database. */
export async function clearDb(): Promise<void> {
  const db = await getDb();
  await Promise.all([...db.objectStoreNames].map((name) => db.clear(name)));
}
