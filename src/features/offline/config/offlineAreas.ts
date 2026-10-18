/** Zooms a downloaded area covers (docs/PLAN.md, Etap 3). */
export const AREA_MIN_ZOOM = 12;
export const AREA_MAX_ZOOM = 19;
/** Most tiles one area may hold: keeps a download to a few km² and polite to Geoportal. */
export const MAX_AREA_TILES = 3000;
/** Average tile sizes measured on Geoportal (bytes), for the estimate before downloading. */
export const AVG_TILE_BYTES = { ortho: 8_000, nmt: 180_000, topo: 30_000, custom: 20_000 } as const;
/** Parallel requests while downloading: Geoportal has no stated limit, its servers are often busy. */
export const DOWNLOAD_CONCURRENCY = 4;
/** Each area has its own Cache Storage cache, so deleting one never breaks another. */
export const AREA_CACHE_PREFIX = 'mapa-obszar-';
/** Area description stored inside its cache next to the tiles. */
export const AREA_META_KEY = 'offline-area.json';
