import type { FieldPoint, Track } from '@/shared/types/domain';
import { escapeXml } from './escapeXml';

const iso = (t: number) => new Date(t).toISOString();
const coord = (n: number) => n.toFixed(7);

/** GPX 1.1: points as waypoints, tracks as trk with one trkseg per segment. */
export function toGpx(points: readonly FieldPoint[], tracks: readonly Track[]): string {
  const wpts = points.map((p) =>
    [
      `  <wpt lat="${coord(p.lat)}" lon="${coord(p.lng)}">`,
      `    <time>${iso(p.created)}</time>`,
      `    <name>${escapeXml(p.name)}</name>`,
      p.desc ? `    <desc>${escapeXml(p.desc)}</desc>` : null,
      `    <type>${p.type}</type>`,
      `  </wpt>`,
    ]
      .filter(Boolean)
      .join('\n'),
  );
  const trks = tracks
    .filter((t) => t.segments.some((s) => s.length > 0))
    .map((t) =>
      [
        `  <trk>`,
        `    <name>${escapeXml(t.name)}</name>`,
        ...t.segments
          .filter((s) => s.length > 0)
          .map((s) =>
            [
              `    <trkseg>`,
              ...s.map(
                ([lat, lng, time]) =>
                  `      <trkpt lat="${coord(lat)}" lon="${coord(lng)}"><time>${iso(time)}</time></trkpt>`,
              ),
              `    </trkseg>`,
            ].join('\n'),
          ),
        `  </trk>`,
      ].join('\n'),
    );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="Mapa poszukiwań" xmlns="http://www.topografix.com/GPX/1/1">',
    ...wpts,
    ...trks,
    '</gpx>',
    '',
  ].join('\n');
}
