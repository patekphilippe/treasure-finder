import type { Candidate } from '@/shared/types/domain';
import { formatMetres } from './formatMetres';

/** "6×4 m, głębokość 1,1 m, pole 20 m²" */
export function describeCandidate(c: Candidate): string {
  const relief = `${c.reliefM >= 0 ? 'wysokość' : 'głębokość'} ${formatMetres(Math.abs(c.reliefM))} m`;
  return `${formatMetres(c.lengthM)}×${formatMetres(c.widthM)} m, ${relief}, pole ${Math.round(c.areaM2)} m²`;
}
