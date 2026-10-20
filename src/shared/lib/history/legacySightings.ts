import type { MapRef, Sighting, YearSpan } from '@/shared/types/domain';
import { yearsFromText } from './yearsFromText';

/** a map the app knows, and the text older descriptions used for it */
export interface KnownMap {
  ref: MapRef;
  /** e.g. the layer's name, or "Name (własna mapa" (the own map's label without its end) */
  text: string;
  years?: YearSpan;
  /** the year shown is written right after `text` ("Ortofotomapa archiwalna 2004") */
  timed?: boolean;
}

const how = (source: string): Sighting['how'] =>
  /auto \(AI/.test(source)
    ? 'ai'
    : /AI ze źródła/.test(source)
      ? 'zrodlo'
      : /\.(geo)?json$/i.test(source.trim())
        ? 'import'
        : 'reczne';

/**
 * The maps an object from before `seen` existed was seen on, read from its description: every
 * known map named in it (two for a comparison of maps), in the order written. When none is
 * named, one sighting without a map that keeps the description and the years it mentions.
 */
export function legacySightings(source: string, known: readonly KnownMap[]): Sighting[] {
  const found: { at: number; end: number; sighting: Sighting }[] = [];
  for (const k of known) {
    const at = source.indexOf(k.text);
    if (at < 0) continue;
    const end = at + k.text.length;
    const sighting: Sighting = { map: k.ref, how: how(source) };
    if (k.timed) {
      const year = /^\s+(\d{4})(?!\d)/.exec(source.slice(end));
      if (year && k.ref.kind === 'wms') {
        const time = Number(year[1]);
        sighting.map = { ...k.ref, time };
        sighting.years = { from: time, to: time };
      }
    } else if (k.years) sighting.years = k.years;
    found.push({ at, end, sighting });
  }
  // "Mapa (własna mapa" is inside "Stara Mapa (własna mapa": only the longer name counts
  const named = found.filter(
    (f) => !found.some((g) => g !== f && g.at <= f.at && g.end >= f.end && g.end - g.at > f.end - f.at),
  );
  if (named.length > 0) return named.sort((a, b) => a.at - b.at).map((f) => f.sighting);
  const years = yearsFromText(source);
  return [
    {
      map: { kind: 'none', label: source },
      how: how(source),
      ...(years && { years }),
    },
  ];
}
