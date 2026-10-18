import type { IDBPDatabase, IDBPTransaction, StoreNames } from 'idb';
import { RECOMPUTE_REASON } from '../lib/io/importCandidatesGeoJSON';
import type { Candidate } from '../types/domain';
import type { AppDB } from './schema';

type UpgradeTx = IDBPTransaction<AppDB, StoreNames<AppDB>[], 'versionchange'>;

/**
 * Schema migrations keyed by version number. Each step upgrades from
 * `version - 1` to `version`; never edit a released step, add a new one.
 */
export async function migrate(
  db: IDBPDatabase<AppDB>,
  oldVersion: number,
  tx?: UpgradeTx,
): Promise<void> {
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
  if (oldVersion < 3 && oldVersion >= 1 && tx && db.objectStoreNames.contains('candidates')) {
    // interpretation model: old candidates keep decision and note, but are marked for recomputation
    let cursor = await tx.objectStore('candidates').openCursor();
    while (cursor) {
      const old = cursor.value as unknown as Record<string, unknown>;
      if (!('interpretation' in old)) {
        const next: Candidate = {
          id: String(old.id),
          sheetId: String(old.sheetId ?? ''),
          form: 'pojedynczy_dol',
          interpretation: 'nieokreslona',
          confidence: 0,
          alternatives: [],
          priority: old.protectedLikely === true ? 'chroniony' : 'niski',
          flags: { uxo: false, warGraves: false },
          reasons: [RECOMPUTE_REASON],
          lat: Number(old.lat),
          lng: Number(old.lng),
          areaM2: Number(old.areaM2 ?? 0),
          lengthM: Number(old.lengthM ?? 0),
          widthM: Number(old.widthM ?? 0),
          reliefM: Number(old.reliefM ?? 0),
          score: Number(old.score ?? 0),
          outline: null,
          searchZone: null,
          exclusionZone: null,
          decision: (old.decision as Candidate['decision']) ?? 'nowy',
          note: String(old.note ?? ''),
          needsRecompute: true,
        };
        await cursor.update(next);
      }
      cursor = await cursor.continue();
    }
  }
  if (oldVersion < 4 && !db.objectStoreNames.contains('water')) {
    // water from BDOT10k for the analysis
    db.createObjectStore('water', { keyPath: 'id' });
  }
}
