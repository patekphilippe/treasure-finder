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

const IHPAN_WMS = 'https://pastmaps.cenagis.edu.pl/geoserver/ihpan/wms';
const IHPAN_ATTRIBUTION =
  '<a href="https://pastmaps.cenagis.edu.pl/" target="_blank" rel="noreferrer">IH PAN, Mapy z przeszłością</a>, skany: Mapster';
const IHPAN_TERMS = 'https://pastmaps.cenagis.edu.pl/';

const ihpan = (
  id: string,
  label: string,
  years: string,
  coverage: string,
  maxNativeZoom: number,
): HistoricalLayer => ({
  id,
  label,
  years,
  coverage,
  url: IHPAN_WMS,
  layers: `${id}_3857`,
  maxNativeZoom,
  attribution: IHPAN_ATTRIBUTION,
  termsUrl: IHPAN_TERMS,
});

export const ORTHO_ARCHIVE_ID = 'orto-archiwalna';

export const HISTORICAL_LAYERS: readonly HistoricalLayer[] = [
  ihpan('m25k', 'Messtischblatt 1:25 000', '1870–1945', 'Dawne ziemie niemieckie', 17),
  ihpan('wig25k', 'WIG 1:25 000', '1918–1939', 'Część II RP', 17),
  ihpan('wig100k', 'WIG 1:100 000', '1918–1939', 'Cała Polska', 15),
  ihpan('kdr', 'Karte des Deutschen Reiches 1:100 000', 'ok. 1900', 'Cała Polska', 15),
  ihpan('kdwr', 'Karte des Westlichen Russlands 1:100 000', '1914–1921', 'Dawny zabór rosyjski', 15),
  ihpan('dwuwiorstowka', 'Dwuwiorstówka 1:84 000', '1908–1936', 'Dawny zabór rosyjski', 15),
  ihpan('kummersberg', 'Mapa Galicji Kummersberga 1:115 200', '1855', 'Galicja', 14),
  ihpan('TKKP_126k', 'Topograficzna Karta Królestwa Polskiego', '1839–1843', 'Królestwo Polskie', 14),
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
