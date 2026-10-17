/**
 * Geoportal NMT hillshade as WMTS in EPSG:2180 (pre-rendered, ~0.5–1 s per tile, cached
 * 30 days) — the WMS of the same layer renders on demand and took 12–27 s per tile.
 * TopLeftCorner is given as northing, easting (EPSG:2180 axis order).
 */
export const NMT_WMTS_2180 = {
  url: 'https://mapy.geoportal.gov.pl/wss/service/PZGIK/NMT/GRID1/WMTS/ShadedRelief',
  layer: 'ISOK_Cien',
  format: 'image/jpeg',
  tileSize: 512,
  originNorthing: 850_000,
  originEasting: 100_000,
  /** metres per pixel for EPSG:2180:0 … EPSG:2180:12 (scale denominator × 0.28 mm) */
  resolutions: [
    2116.670900008467, 1058.3354500042335, 529.1677250021168, 264.5838625010584, 132.2919312505292,
    66.1459656252646, 26.458386250105836, 13.229193125052918, 6.614596562526459, 2.6458386250105836,
    1.3229193125052918, 0.5291677250021167, 0.26458386250105836,
  ],
  matrixSize: [
    [1, 1],
    [2, 2],
    [3, 3],
    [6, 6],
    [12, 11],
    [23, 22],
    [57, 54],
    [114, 108],
    [228, 215],
    [569, 536],
    [1137, 1071],
    [2843, 2676],
    [5685, 5352],
  ] as const,
} as const;
