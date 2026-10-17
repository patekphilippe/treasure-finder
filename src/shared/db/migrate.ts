import type { IDBPDatabase } from 'idb';
import type { AppDB } from './schema';

/**
 * Schema migrations keyed by version number. Each step upgrades from
 * `version - 1` to `version`; never edit a released step, add a new one.
 */
export function migrate(db: IDBPDatabase<AppDB>, oldVersion: number): void {
  if (oldVersion < 1) {
    const points = db.createObjectStore('points', { keyPath: 'id' });
    points.createIndex('byCandidate', 'candidateId');
    db.createObjectStore('tracks', { keyPath: 'id' });
    db.createObjectStore('sheets', { keyPath: 'id' });
    const candidates = db.createObjectStore('candidates', { keyPath: 'id' });
    candidates.createIndex('bySheet', 'sheetId');
    db.createObjectStore('context', { keyPath: 'id' });
    db.createObjectStore('zones', { keyPath: 'id' });
    db.createObjectStore('photos');
    const rasters = db.createObjectStore('rasters', { keyPath: 'id' });
    rasters.createIndex('bySheet', 'sheetId');
  }
  if (oldVersion < 2) {
    // places marked by the uneven-ground analysis
    db.createObjectStore('areas', { keyPath: 'id' });
  }
}
