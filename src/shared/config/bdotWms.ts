/** BDOT10k WMS (CORS-enabled) used to skip man-made features that are not landforms. */
export const BDOT_WMS_URL =
  'https://mapy.geoportal.gov.pl/wss/service/pub/guest/kompozycja_BDOT10k_WMS/MapServer/WMSServer';

export interface ExclusionGroup {
  label: string;
  layers: string[];
  /** metres around the features that are skipped too */
  bufferM: number;
}

/**
 * Removing buildings from the NMT leaves bumps; paved roads, railways and ditches give long
 * straight cuts and banks that look like trenches. Dirt roads stay: an old sunken road is
 * often still a forest track.
 */
export const BDOT_EXCLUSION: ExclusionGroup[] = [
  {
    label: 'zabudowa',
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
    bufferM: 25,
  },
  {
    label: 'drogi utwardzone i kolej',
    layers: [
      'JDrLNUt',
      'JDLNTw',
      'JDrZTw',
      'JDrG',
      'JDrEk',
      'JAu',
      'LKNelJ',
      'LKNelD',
      'LKNelW',
      'LKZelJ',
      'LKZelD',
      'LKZelW',
      'LKNc',
      'LKWs',
      'TSt',
      'Umo',
    ],
    bufferM: 10,
  },
  { label: 'wody i rowy', layers: ['rz', 'rzOk', 'row', 'kan', 'kanOkr', 'WPow'], bufferM: 8 },
];

/** @deprecated kept for the uneven-ground map: buildings only */
export const BUILDINGS_WMS = { url: BDOT_WMS_URL, layers: BDOT_EXCLUSION[0]!.layers };
export const BUILDING_BUFFER_M = BDOT_EXCLUSION[0]!.bufferM;
