import { formatHectares } from '@/shared/lib/format';
import type { RoughArea } from '@/shared/types/domain';

/** "0,42 ha, wydłużone 4:1, nasilenie 78%" */
export function describeShape(a: Pick<RoughArea, 'areaM2' | 'elongation' | 'strength'>): string {
  const shape = a.elongation >= 2 ? `wydłużone ${Math.round(a.elongation)}:1` : 'zwarte';
  return `${formatHectares(a.areaM2)} ha, ${shape}, nasilenie ${a.strength}%`;
}
