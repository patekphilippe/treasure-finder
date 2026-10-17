import type { DBSchema } from 'idb';
import type {
  Candidate,
  ContextFeature,
  FieldPoint,
  RasterRecord,
  Sheet,
  Track,
  Zone,
} from '@/shared/types/domain';

export const DB_NAME = 'mapa-poszukiwan';
export const DB_VERSION = 1;

export interface AppDB extends DBSchema {
  points: { key: string; value: FieldPoint; indexes: { byCandidate: string } };
  tracks: { key: string; value: Track };
  sheets: { key: string; value: Sheet };
  candidates: { key: string; value: Candidate; indexes: { bySheet: string } };
  context: { key: string; value: ContextFeature };
  zones: { key: string; value: Zone };
  photos: { key: string; value: Blob };
  rasters: { key: string; value: RasterRecord; indexes: { bySheet: string } };
}
