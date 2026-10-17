import type { AnalysisParams } from '@/shared/types/domain';

export type AnalysisRequest =
  { type: 'run'; file: File; params: AnalysisParams } | { type: 'cancel' };

export type AnalysisResponse =
  | { type: 'progress'; percent: number; step: string }
  | { type: 'done'; sheetId: string }
  | { type: 'cancelled' }
  | { type: 'error'; message: string };
