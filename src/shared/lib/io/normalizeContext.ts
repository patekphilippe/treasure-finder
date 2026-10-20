import type { ContextFeature, MapRef, Sighting } from '@/shared/types/domain';
import { isRecord, num, type Raw } from './guards';

const HOW: readonly Sighting['how'][] = ['ai', 'reczne', 'zrodlo', 'import'];

const mapRef = (m: unknown): MapRef | null => {
  if (!isRecord(m) || typeof m.label !== 'string') return null;
  if (m.kind === 'none') return { kind: 'none', label: m.label };
  if (typeof m.id !== 'string') return null;
  if (m.kind === 'own') return { kind: 'own', id: m.id, label: m.label };
  if (m.kind !== 'wms') return null;
  const time = num(m.time);
  return { kind: 'wms', id: m.id, label: m.label, ...(time !== null && { time }) };
};

const sighting = (s: unknown): Sighting | null => {
  if (!isRecord(s) || !HOW.includes(s.how as Sighting['how'])) return null;
  const map = mapRef(s.map);
  if (!map) return null;
  const out: Sighting = { map, how: s.how as Sighting['how'] };
  const years = isRecord(s.years) ? { from: num(s.years.from), to: num(s.years.to) } : null;
  if (years?.from != null && years.to != null && years.from <= years.to)
    out.years = { from: years.from, to: years.to };
  const at = num(s.at);
  if (at !== null) out.at = at;
  const confidence = num(s.confidence);
  if (confidence !== null && confidence >= 0 && confidence <= 1) out.confidence = confidence;
  return out;
};

/**
 * Archival objects of a backup. Objects from versions 1 and 2 have no `seen` and stay as they
 * are (their maps are read from `source`); in version 3 broken sightings and labels are dropped.
 */
export function normalizeContext(list: unknown): ContextFeature[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((x): x is Raw => isRecord(x) && typeof x.id === 'string')
    .map((raw) => {
      const { seen, label, ...rest } = raw;
      const f = rest as unknown as ContextFeature;
      if (typeof label === 'string' && label !== '') f.label = label;
      const read = Array.isArray(seen) ? seen.map(sighting).filter((s) => s !== null) : [];
      if (read.length > 0) f.seen = read;
      return f;
    });
}
