import { openDB, type IDBPDatabase } from 'idb';
import { migrate } from './migrate';
import { DB_NAME, DB_VERSION, type AppDB } from './schema';

let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<AppDB>> {
  dbPromise ??= openDB<AppDB>(DB_NAME, DB_VERSION, {
    upgrade: (db, oldVersion, _newVersion, tx) => migrate(db, oldVersion, tx),
  });
  return dbPromise;
}
