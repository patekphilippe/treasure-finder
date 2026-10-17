import type { Zone } from '@/shared/types/domain';

interface ZoneCoverageProps {
  zone: Zone;
}

/** Coverage of a permit zone by searched swaths — implemented in the coverage step. */
export function ZoneCoverage({ zone }: ZoneCoverageProps) {
  void zone;
  return null;
}
