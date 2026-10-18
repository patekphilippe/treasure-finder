/**
 * Geoportal topographic map 1:10 000 as WMTS in EPSG:2180 (the same grid origin and
 * 512 px tiles as the NMT hillshade; only EPSG:2180 and EPSG:4326 are offered).
 */
const SCALE_DENOMINATORS = [
  7559538.928571429, 3779769.4642857146, 1889884.7321428573, 944942.3660714286, 472471.1830357143,
  236235.59151785716, 94494.23660714286, 47247.11830357143, 23623.559151785714, 9449.423660714287,
  4724.711830357143, 1889.8847321428573, 944.9423660714286,
];

const URL = 'https://mapy.geoportal.gov.pl/wss/service/WMTS/guest/wmts/TOPO';
const LAYER = 'MAPA TOPOGRAFICZNA';

export const TOPO_WMTS_2180 = {
  tileSize: 512,
  originNorthing: 850_000,
  originEasting: 100_000,
  /** metres per pixel: scale denominator × 0.28 mm */
  resolutions: SCALE_DENOMINATORS.map((s) => s * 0.00028),
  matrixSize: [
    [1, 1],
    [2, 2],
    [3, 3],
    [6, 6],
    [12, 12],
    [24, 23],
    [60, 57],
    [120, 113],
    [240, 225],
    [598, 562],
    [1196, 1123],
    [2990, 2806],
    [5980, 5611],
  ] as const,
  tileUrl: (level: number, row: number, col: number) =>
    `${URL}?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${encodeURIComponent(LAYER)}` +
    `&STYLE=default&TILEMATRIXSET=EPSG:2180&TILEMATRIX=EPSG:2180:${level}&TILEROW=${row}` +
    `&TILECOL=${col}&FORMAT=image/jpeg`,
};
