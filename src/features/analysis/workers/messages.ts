import type { Geometry } from 'geojson';
import type { Candidate } from '@/shared/types/domain';

export interface AnalysisRequest {
  name: string;
  buffer: ArrayBuffer;
  /** archival context features, WGS84 */
  context: Geometry[];
  /** extra water (e.g. BDOT10k rivers), WGS84 */
  water: Geometry[];
  /** skip buildings and yards (BDOT10k WMS) */
  excludeBuildings: boolean;
}

export interface SheetInfo {
  sheetId: string;
  cell: number;
  cols: number;
  rows: number;
  originE: number;
  originN: number;
}

export type AnalysisResponse =
  | { type: 'progress'; share: number; step: string }
  | { type: 'done'; sheet: SheetInfo; candidates: Candidate[] }
  | { type: 'error'; message: string };
