import type { Geometry } from 'geojson';
import type { AnalysisSettings } from '@/shared/lib/detect';
import type { ExclusionGroupResult } from '@/shared/lib/tiles';
import type { Candidate, ReliefKind } from '@/shared/types/domain';

export interface AnalysisRequest {
  name: string;
  buffer: ArrayBuffer;
  /** archival context features, WGS84 */
  context: Geometry[];
  /** extra water (e.g. BDOT10k rivers), WGS84 */
  water: Geometry[];
  /** forbidden zones ('zakaz'), WGS84 */
  forbidden: Geometry[];
  /** skip buildings and yards (BDOT10k WMS) */
  excludeBuildings: boolean;
  /** LRM radius, threshold and weights from the analysis settings */
  settings: AnalysisSettings;
}

export interface SheetInfo {
  sheetId: string;
  cell: number;
  cols: number;
  rows: number;
  originE: number;
  originN: number;
}

/** BDOT10k cells left out of the analysis: one bit per group, and what happened to each group */
export interface ExclusionResult {
  mask: Uint8Array;
  groups: ExclusionGroupResult[];
}

/** one relief layer of the sheet, as an image on its EPSG:2180 grid */
export interface ReliefImage {
  kind: ReliefKind;
  blob: Blob;
  /** metres per image pixel (the sheet's cell, or coarser for big sheets) */
  res: number;
}

export type AnalysisResponse =
  | { type: 'progress'; share: number; step: string }
  | {
      type: 'done';
      sheet: SheetInfo;
      candidates: Candidate[];
      /** null when BDOT10k exclusion was off */
      exclusion: ExclusionResult | null;
      reliefs: ReliefImage[];
    }
  | { type: 'error'; message: string };
