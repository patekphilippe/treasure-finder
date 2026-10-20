/** Part of the tile URL: a new rendering gets a new number, so cached tiles never go stale. */
export const RELIEF_VERSION = 1;
/**
 * From zoom 12 a tile is ~6.5 km: the WCS returns such windows whole, bigger ones (zoom 11)
 * come back about half zeros (checked in 10 cities, 20.10.2026). Below, the app keeps the
 * Geoportal's own shading, an overview anyway.
 */
export const RELIEF_MIN_ZOOM = 12;
/** At 16 a 512 px tile has ~0.75 m pixels, already finer than the 1 m NMT. */
export const RELIEF_MAX_ZOOM = 16;
/** Tile side in pixels: a standard 256 px map tile at twice the density, sharp on phones. */
export const RELIEF_TILE_PX = 512;
export const RELIEF_JPEG_QUALITY = 80;
/** Poland with a margin; tiles wholly outside are not rendered. */
export const RELIEF_BOUNDS = { south: 48.9, north: 55, west: 14, east: 24.3 } as const;
/**
 * Newly rendered tiles a day: per IP (an offline area is up to 3000) and for everyone. Each new
 * tile is one R2 write: 30 000 a day keeps a month under R2's free million writes.
 */
export const RELIEF_IP_DAILY = 8000;
export const RELIEF_ALL_DAILY = 30_000;

/** GUGiK NMT (1 m grid) as WCS 2.0: open data, no fees or access constraints. */
export const NMT_WCS_URL =
  'https://mapy.geoportal.gov.pl/wss/service/PZGIK/NMT/GRID1/WCS/DigitalTerrainModelFormatTIFF';
export const NMT_COVERAGE_ID = 'DTM_PL-KRON86-NH_TIFF';
export const NMT_TIMEOUT_MS = 25_000;
