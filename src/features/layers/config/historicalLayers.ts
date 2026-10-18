/**
 * Historical map layers (docs/MAPY_HISTORYCZNE.md). All are WMS in EPSG:3857 and online only:
 * none of the providers allows bulk tile download, so they are not offered for offline areas.
 */
export interface HistoricalLayer {
  id: string;
  label: string;
  /** years shown under the name */
  years: string;
  coverage: string;
  url: string;
  layers: string;
  maxNativeZoom: number;
  attribution: string;
  termsUrl: string;
  /** the service draws nothing when zoomed out further (MaxScaleDenominator) */
  minZoom?: number;
  /** WMS with a TIME dimension: the user picks a year */
  yearRange?: { min: number; max: number };
}

const UMWD_ATTRIBUTION =
  'Źródło danych: <a href="https://geoportal.dolnyslask.pl/" target="_blank" rel="noreferrer">Urząd Marszałkowski Województwa Dolnośląskiego</a>';
const UMWD_TERMS = 'https://geoportal.dolnyslask.pl/userreg/regulamin-pl.html';

/** Lower Silesian geoportal, ArcGIS WMS: layer "1" is the image (2 and 3 are footprints). */
const umwd = (id: string, label: string, years: string): HistoricalLayer => ({
  id,
  label,
  years,
  coverage: 'Dolny Śląsk',
  url: `https://geoportal.dolnyslask.pl/gpservices/${id}/MapServer/WMSServer`,
  layers: '1',
  maxNativeZoom: 17,
  attribution: UMWD_ATTRIBUTION,
  termsUrl: UMWD_TERMS,
});

export const ORTHO_ARCHIVE_ID = 'orto-archiwalna';

// IH PAN „Mapy z przeszłością” (WIG, Messtischblatt, mapy rosyjskie): czeka na zgodę, docs/MAPY_HISTORYCZNE.md
export const HISTORICAL_LAYERS: readonly HistoricalLayer[] = [
  umwd('UMWD_Messtischblat_starsze', 'Messtischblatt Dolny Śląsk, starsze wydania', '1883–1942'),
  umwd('UMWD_Messtischblat_nowsze', 'Messtischblatt Dolny Śląsk, nowsze wydania', '1905–1944'),
  {
    id: ORTHO_ARCHIVE_ID,
    label: 'Ortofotomapa archiwalna',
    years: 'od 1995',
    coverage: 'Cała Polska, roczniki różne dla obszarów',
    url: 'https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/StandardResolutionTime',
    layers: 'Raster',
    maxNativeZoom: 19,
    // MaxScaleDenominator 1:47 247; with 512 px tiles that is zoom 14
    minZoom: 14,
    attribution: '<a href="https://www.geoportal.gov.pl/" target="_blank" rel="noreferrer">GUGiK</a>',
    termsUrl: 'https://www.geoportal.gov.pl/',
    yearRange: { min: 1995, max: 2025 },
  },
];
