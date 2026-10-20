import type {
  Candidate,
  ContextFeature,
  FieldPoint,
  OwnMap,
  Track,
  Zone,
} from '@/shared/types/domain';

export const BACKUP_VERSION = 4;

export interface ExportData {
  points: FieldPoint[];
  tracks: Track[];
  candidates: Candidate[];
  zones: Zone[];
  context: ContextFeature[];
  /** own historical maps with their images */
  maps: OwnMap[];
}

/** An own map in kopia.json: everything but the image, which lies in `mapy/` (path in `image`). */
export type OwnMapEntry = Omit<OwnMap, 'image'> & { image: string };

/** kopia.json — the lossless backup read back by import (4: own maps in `mapy/`). */
export interface BackupV4 extends Omit<ExportData, 'maps'> {
  wersja: typeof BACKUP_VERSION;
  utworzono: string;
  maps: OwnMapEntry[];
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
  mapsDir: 'mapy/',
} as const;

export const photoPath = (photoId: string) => `${ZIP_FILES.photosDir}${photoId}.jpg`;

const MAP_EXT: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

/** `mapy/<id>.webp` (own maps are kept as WebP; JPEG and PNG keep their extension). */
export const mapPath = (mapId: string, type: string) =>
  `${ZIP_FILES.mapsDir}${mapId}.${MAP_EXT[type] ?? 'webp'}`;

/** The image type back from a map's path in the archive. */
export const mapImageType = (path: string) =>
  Object.keys(MAP_EXT).find((type) => path.endsWith(`.${MAP_EXT[type]}`)) ?? 'image/webp';
