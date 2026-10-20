import type { YearSpan } from '@/shared/types/domain';

/** "1883–1942", or "1936" for a single year. */
export function formatYears(span: YearSpan): string {
  return span.from === span.to ? `${span.from}` : `${span.from}–${span.to}`;
}
