export const POLAND_CENTER: [number, number] = [52.1, 19.4];
export const DEFAULT_ZOOM = 6;
export const MAX_ZOOM = 21;

export const OSM_LAYER = {
  name: 'OpenStreetMap',
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxNativeZoom: 19,
} as const;

const GEOPORTAL_ATTRIBUTION = '&copy; <a href="https://www.geoportal.gov.pl">GUGiK</a>';

export const GEOPORTAL_WMS_OPTIONS = {
  layers: 'Raster',
  format: 'image/png',
  version: '1.3.0',
  tileSize: 512,
  attribution: GEOPORTAL_ATTRIBUTION,
} as const;

export const ORTHO_WMS_URL =
  'https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/StandardResolution';

export const NMT_SHADED_WMS_URL =
  'https://mapy.geoportal.gov.pl/wss/service/PZGIK/NMT/GRID1/WMS/ShadedRelief';

/** Zoom used when the map starts following the user. */
export const FOLLOW_ZOOM = 17;
/** Colour of the own-position dot (kept blue by convention, distinct from point markers). */
export const POSITION_COLOR = '#2563eb';
