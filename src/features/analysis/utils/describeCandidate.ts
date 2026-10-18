import { formatHectares } from '@/shared/lib/format';
import type { Candidate } from '@/shared/types/domain';
import { formatMetres } from './formatMetres';

/** "6×4 m, głębokość 1,1 m"; for groups and field patterns the area they cover. */
export function describeCandidate(c: Candidate): string {
  if (c.form === 'skupisko' || c.form === 'uklad_rownolegly') {
    return c.form === 'skupisko'
      ? `zespół form, łącznie ${Math.round(c.areaM2)} m²`
      : `obszar ${formatHectares(c.areaM2)} ha`;
  }
  const relief = `${c.reliefM >= 0 ? 'wysokość' : 'głębokość'} ${formatMetres(Math.abs(c.reliefM))} m`;
  return `${formatMetres(c.lengthM)}×${formatMetres(c.widthM)} m, ${relief}`;
}
