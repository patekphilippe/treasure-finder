import type { YearSpan } from '@/shared/types/domain';

/**
 * Historical map layers (docs/MAPY_HISTORYCZNE.md). WMS (in EPSG:3857, or EPSG:2180 where the
 * service places that one correctly), online only:
 * none of the providers allows bulk tile download, so they are not offered for offline areas.
 */
export interface HistoricalLayer {
  id: string;
  label: string;
  /** years shown under the name */
  years: string;
  /** the years the layer's maps come from (an object seen on it gets them) */
  yearSpan?: YearSpan;
  coverage: string;
  url: string;
  layers: string;
  maxNativeZoom: number;
  attribution: string;
  termsUrl: string;
  /** the service draws nothing when zoomed out further (MaxScaleDenominator) */
  minZoom?: number;
  /** requests in flight at once; slow servers drop tiles when asked for too many */
  maxParallel?: number;
  /** WMS with a TIME dimension: the user picks a year */
  yearRange?: { min: number; max: number };
  /**
   * ask the service in EPSG:2180 and warp: its own Web Mercator output is misplaced
   * (Lower Silesian Messtischblatt ~150 m off against OSM and the NMT; checked 18.10.2026)
   */
  ask2180?: boolean;
  /** WMS image format when not plain PNG (image/png8 for big scans: smaller and faster) */
  format?: string;
}

const UMWD_ATTRIBUTION =
  'Źródło danych: <a href="https://geoportal.dolnyslask.pl/" target="_blank" rel="noreferrer">Urząd Marszałkowski Województwa Dolnośląskiego</a>';
const UMWD_TERMS = 'https://geoportal.dolnyslask.pl/userreg/regulamin-pl.html';

/** Lower Silesian geoportal, ArcGIS WMS: layer "1" is the image (2 and 3 are footprints). */
const umwd = (id: string, label: string, from: number, to: number): HistoricalLayer => ({
  id,
  label,
  years: `${from}–${to}`,
  yearSpan: { from, to },
  coverage: 'Dolny Śląsk',
  url: `https://geoportal.dolnyslask.pl/gpservices/${id}/MapServer/WMSServer`,
  layers: '1',
  maxNativeZoom: 17,
  // 12 tiles at once: 4 answered 400; 3 at once plus retries loads them all
  maxParallel: 3,
  ask2180: true,
  // measured: 1727 × 1138 px in 6.6 s and 1.7 MB instead of 12 s and 5.3 MB as PNG
  format: 'image/png8',
  attribution: UMWD_ATTRIBUTION,
  termsUrl: UMWD_TERMS,
});

export const ORTHO_ARCHIVE_ID = 'orto-archiwalna';

// IH PAN „Mapy z przeszłością” (WIG, Messtischblatt, mapy rosyjskie): czeka na zgodę, docs/MAPY_HISTORYCZNE.md
export const HISTORICAL_LAYERS: readonly HistoricalLayer[] = [
  umwd('UMWD_Messtischblat_starsze', 'Messtischblatt Dolny Śląsk, starsze wydania', 1883, 1942),
  umwd('UMWD_Messtischblat_nowsze', 'Messtischblatt Dolny Śląsk, nowsze wydania', 1905, 1944),
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
    attribution:
      '<a href="https://www.geoportal.gov.pl/" target="_blank" rel="noreferrer">GUGiK</a>',
    termsUrl: 'https://www.geoportal.gov.pl/',
    yearRange: { min: 1995, max: 2025 },
  },
];
