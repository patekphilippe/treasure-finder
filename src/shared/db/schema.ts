import type { DBSchema } from 'idb';
import type {
  Candidate,
  RoughArea,
  ContextFeature,
  FieldPoint,
  RasterRecord,
  Sheet,
  Track,
  WaterFeature,
  Zone,
} from '@/shared/types/domain';

export const DB_NAME = 'mapa-poszukiwan';
export const DB_VERSION = 4;

export interface AppDB extends DBSchema {
  points: { key: string; value: FieldPoint; indexes: { byCandidate: string } };
  tracks: { key: string; value: Track };
  sheets: { key: string; value: Sheet };
  candidates: { key: string; value: Candidate; indexes: { bySheet: string } };
  context: { key: string; value: ContextFeature };
  zones: { key: string; value: Zone };
  photos: { key: string; value: Blob };
  rasters: { key: string; value: RasterRecord; indexes: { bySheet: string } };
  areas: { key: string; value: RoughArea };
  water: { key: string; value: WaterFeature };
}
