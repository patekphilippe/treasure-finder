/** Orthophoto as WMTS in Web Mercator — pre-rendered tiles, much faster than the WMS. */
export const ORTHO_WMTS_URL =
  'https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMTS/StandardResolution?SERVICE=WMTS&REQUEST=GetTile' +
  '&VERSION=1.0.0&LAYER=ORTOFOTOMAPA&STYLE=default&TILEMATRIXSET=EPSG:3857&TILEMATRIX=EPSG:3857:{z}' +
  '&TILEROW={y}&TILECOL={x}&FORMAT=image/jpeg';
/** the WMTS has no tiles above this zoom; Leaflet scales them up */
export const ORTHO_MAX_NATIVE_ZOOM = 19;
