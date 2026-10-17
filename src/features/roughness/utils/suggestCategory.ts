import type { AreaCategory } from '@/shared/types/domain';
import { SUGGEST } from '../config/areaCategories';

/** Linear → ditches and trenches; small → a single form; otherwise a cluster of pits. */
export function suggestCategory(areaM2: number, elongation: number): AreaCategory {
  if (elongation >= SUGGEST.linearElongation) return 'liniowe';
  if (areaM2 < SUGGEST.singleMaxAreaM2) return 'pojedyncze';
  return 'skupisko';
}
