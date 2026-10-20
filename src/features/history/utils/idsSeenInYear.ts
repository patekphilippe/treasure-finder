import type { ContextFeature } from '@/shared/types/domain';

/** Ids of the objects seen on a map of this year (a map's span of years counts too). */
export function idsSeenInYear(features: readonly ContextFeature[], year: number): Set<string> {
  return new Set(
    features
      .filter((f) => f.seen?.some((s) => s.years && s.years.from <= year && year <= s.years.to))
      .map((f) => f.id),
  );
}
