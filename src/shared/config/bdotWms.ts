/**
 * Buildings and built-up land from the BDOT10k WMS (CORS-enabled). Building layers by type
 * (farm, residential, industrial, public use, ruins) plus industrial/storage areas, squares
 * and cemeteries. The buffer covers yards around farm buildings.
 */
export const BUILDINGS_WMS = {
  url: 'https://mapy.geoportal.gov.pl/wss/service/pub/guest/kompozycja_BDOT10k_WMS/MapServer/WMSServer',
  layers: [
    'BudGo',
    'BudMJ',
    'BudMW',
    'BudMWy',
    'BudU',
    'BudUWy',
    'BudP1',
    'BudP2',
    'BudPWy',
    'BudZr',
    'TPrz',
    'Pl1',
    'TerCm',
  ],
};
export const BUILDING_BUFFER_M = 25;
