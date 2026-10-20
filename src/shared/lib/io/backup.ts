import type { Candidate, ContextFeature, FieldPoint, Track, Zone } from '@/shared/types/domain';

export const BACKUP_VERSION = 3;

export interface ExportData {
  points: FieldPoint[];
  tracks: Track[];
  candidates: Candidate[];
  zones: Zone[];
  context: ContextFeature[];
}

/** kopia.json — the lossless backup read back by import. */
export interface BackupV3 extends ExportData {
  wersja: typeof BACKUP_VERSION;
  utworzono: string;
}

export const ZIP_FILES = {
  backup: 'kopia.json',
  points: 'punkty.geojson',
  candidates: 'kandydaci.geojson',
  tracks: 'trasy.geojson',
  zones: 'strefy.geojson',
  gpx: 'poszukiwania.gpx',
  finds: 'znaleziska.csv',
  searchZones: 'strefy_poszukiwan.geojson',
  photosDir: 'zdjecia/',
} as const;

export const photoPath = (photoId: string) => `${ZIP_FILES.photosDir}${photoId}.jpg`;
