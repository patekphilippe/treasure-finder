import type { ContextFeature } from '@/shared/types/domain';
import { formatYears } from './formatYears';
import { yearsFromText } from './yearsFromText';

/**
 * The years of the maps an object was seen on, e.g. "1883–1942": from the earliest to the
 * latest. An older object without `seen` gives what its description says. Null when unknown.
 */
export function contextYears(f: Pick<ContextFeature, 'seen' | 'source'>): string | null {
  const spans = (f.seen ?? []).flatMap((s) => (s.years ? [s.years] : []));
  if (spans.length === 0) {
    if (f.seen?.length) return null;
    const read = yearsFromText(f.source);
    return read && formatYears(read);
  }
  return formatYears({
    from: Math.min(...spans.map((s) => s.from)),
    to: Math.max(...spans.map((s) => s.to)),
  });
}
