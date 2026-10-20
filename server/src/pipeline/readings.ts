import { parseMapObjects } from '@/shared/lib/history/parseMapObjects';
import type { MapObject } from '@/shared/lib/history/types';
import type { SourceObject } from '@/shared/types/sources';
import type { UV } from './georef';

export interface MapReading {
  summary: string;
  series: string;
  year: number | null;
  sheetNumber: string | null;
  /** the town a sheet is named after, e.g. "Posen" */
  sheetTitle: string | null;
  legibility: 'dobra' | 'srednia' | 'slaba';
  frameCorners: { nw: UV; ne: UV; se: UV; sw: UV } | null;
  placeNames: { text: string; x: number; y: number }[];
  /** positions as fractions of the image */
  objects: MapObject[];
}

export interface TextItem {
  kind: SourceObject['kind'];
  label: string;
  anchor: string;
  anchorKind: string;
  direction: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'brak';
  distanceM: number | null;
  confidence: number;
}
export interface TextReading {
  summary: string;
  items: TextItem[];
}

const uv = (p: unknown): UV | null => {
  const x = Number((p as UV)?.x);
  const y = Number((p as UV)?.y);
  return Number.isFinite(x) &&
    Number.isFinite(y) &&
    x >= -0.05 &&
    x <= 1.05 &&
    y >= -0.05 &&
    y <= 1.05
    ? { x, y }
    : null;
};

/** The model's JSON for a map image → a checked reading (anything malformed is dropped). */
export function parseMapReading(raw: unknown): MapReading {
  const r = (raw ?? {}) as Record<string, unknown>;
  const fc = r.frameCorners as Record<string, unknown> | null;
  const corners = fc ? { nw: uv(fc.nw), ne: uv(fc.ne), se: uv(fc.se), sw: uv(fc.sw) } : null;
  const year = Number(r.year);
  return {
    summary: typeof r.summary === 'string' ? r.summary.slice(0, 300) : '',
    series: typeof r.series === 'string' ? r.series : 'nieznana',
    year: Number.isInteger(year) && year > 1500 && year < 2100 ? year : null,
    sheetNumber:
      typeof r.sheetNumber === 'string' && r.sheetNumber.trim() ? r.sheetNumber.trim() : null,
    sheetTitle:
      typeof r.sheetTitle === 'string' && r.sheetTitle.trim()
        ? r.sheetTitle
            .replace(/^\d+\s*/, '')
            .trim()
            .slice(0, 80) || null
        : null,
    legibility: r.legibility === 'dobra' || r.legibility === 'slaba' ? r.legibility : 'srednia',
    frameCorners:
      corners && corners.nw && corners.ne && corners.se && corners.sw
        ? (corners as { nw: UV; ne: UV; se: UV; sw: UV })
        : null,
    placeNames: (Array.isArray(r.placeNames) ? r.placeNames : [])
      .map((p: { text?: unknown }) => ({ text: String(p?.text ?? '').trim(), at: uv(p) }))
      .filter((p): p is { text: string; at: UV } => p.text.length >= 3 && p.at !== null)
      .slice(0, 40)
      .map((p) => ({ text: p.text, ...p.at })),
    // the shared parser checks kinds and bounds; fractions are a 1 × 1 image
    objects: parseMapObjects(r, 1, 1),
  };
}

const KINDS: readonly string[] = ['osada', 'droga', 'mlyn', 'karczma', 'brod', 'inne'];
const DIRECTIONS: readonly string[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'brak'];

export function parseTextReading(raw: unknown): TextReading {
  const r = (raw ?? {}) as { summary?: unknown; objects?: unknown };
  const items = (Array.isArray(r.objects) ? r.objects : []).flatMap(
    (o: Record<string, unknown>) => {
      const anchor = String(o?.anchor ?? '').trim();
      if (!anchor) return [];
      const d = Number(o.distanceM);
      const c = Number(o.confidence);
      return [
        {
          kind: (KINDS.includes(String(o.kind)) ? o.kind : 'inne') as SourceObject['kind'],
          label: String(o.label ?? '').slice(0, 120),
          anchor: anchor.slice(0, 80),
          anchorKind: String(o.anchorKind ?? 'inne'),
          direction: (DIRECTIONS.includes(String(o.direction))
            ? o.direction
            : 'brak') as TextItem['direction'],
          distanceM: Number.isFinite(d) && d > 0 && d < 50_000 ? d : null,
          confidence: Number.isFinite(c) ? Math.max(0, Math.min(1, c)) : 0.5,
        },
      ];
    },
  );
  return {
    summary: typeof r.summary === 'string' ? r.summary.slice(0, 300) : '',
    items: items.slice(0, 50),
  };
}

/**
 * Positions come as fractions of width and height; on a non-square image those are different
 * lengths. Scaling y by height ÷ width gives square units, which shape-keeping fits need.
 */
export function squareReading(r: MapReading, aspect: number): MapReading {
  if (aspect === 1) return r;
  const sq = <T extends { y: number }>(p: T): T => ({ ...p, y: p.y * aspect });
  return {
    ...r,
    frameCorners: r.frameCorners
      ? {
          nw: sq(r.frameCorners.nw),
          ne: sq(r.frameCorners.ne),
          se: sq(r.frameCorners.se),
          sw: sq(r.frameCorners.sw),
        }
      : null,
    placeNames: r.placeNames.map(sq),
    objects: r.objects.map(sq),
  };
}
