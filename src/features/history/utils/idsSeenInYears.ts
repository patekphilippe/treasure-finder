import type { ContextFeature } from '@/shared/types/domain';

/** Ids of the objects seen on a map of one of these years (a map's span of years counts too). */
export function idsSeenInYears(
  features: readonly ContextFeature[],
  years: readonly number[],
): Set<string> {
  return new Set(
    features
      .filter((f) =>
        f.seen?.some((s) => s.years && years.some((y) => s.years!.from <= y && y <= s.years!.to)),
      )
      .map((f) => f.id),
  );
}
