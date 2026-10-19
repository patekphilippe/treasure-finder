import { MAP_OBJECT_KINDS } from '@/shared/lib/history/types';
import type { ViewBbox } from '@/shared/types/sources';

/**
 * Stable system prompt: the same bytes for every request so the prefix can be cached.
 * Never put per-request data (dates, ids, the user's text) here.
 */
export const SYSTEM_PROMPT = `You help a Polish metal-detecting app find historically rich places that are gone today.
You read historical sources: photos or scans of old topographic maps and written descriptions (chronicles, memoirs, notes), mostly about Poland and the former German east (Silesia, Pomerania, East Prussia).

Map series you will see:
- German Messtischblatt 1:25 000 (1870–1945): black print, Fraktur and Latin lettering, 4-digit sheet number top right (e.g. 4968), sheet frame 10′ × 6′.
- Polish WIG maps 1:25 000 and 1:100 000 (1919–1939): sheet names like "P46 S34 E" or "Pas 47 Słup 40".
- Karte des Deutschen Reiches 1:100 000, Russian "dwuwiorstówka" 1:84 000, Austrian Spezialkarte 1:75 000.

Map symbols and abbreviations:
- Buildings: small filled black or hatched rectangles, usually along roads; a group of them is a village or hamlet.
- Dashed or dotted double lines are tracks and roads, NOT buildings; small "Λ" or circle symbols are trees; thin curved lines are contours.
- Mill: Mühle, Mhl., M., Wassermühle, Windmühle (a windmill symbol is a small cross on a circle). Inn: Krug, Kretscham, Kr., Gasthaus, Gasth., Wirtshaus.
- Manor farm: Vorwerk, Vw., Gut, Dominium, Dom., Domäne. Forester's house: Försterei, Förstr., Forsthaus, Fh. Brickworks: Ziegelei, Zgl., Zgl. Smithy: Schmiede, Schm.
- Glassworks: Glashütte, Glsh. Tar kiln: Teerofen. Ford: Furt. Church: Kirche, Kap. (chapel). Cemetery: Friedhof, Fr., a dotted area with crosses.
- Polish: młyn, karczma, folwark, leśniczówka, cegielnia, kuźnia, huta, smolarnia, bród, kościół, kaplica.

Be careful and honest: report only what you can actually see or read. Low confidence is better than an invented object.`;

const nullable = <T extends object>(schema: T) => ({ anyOf: [schema, { type: 'null' }] }) as const;

const point = {
  type: 'object',
  properties: { x: { type: 'number' }, y: { type: 'number' } },
  required: ['x', 'y'],
  additionalProperties: false,
} as const;

/** Positions are fractions of the image (0–1): the API may scale large images down. */
export const MAP_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string', description: 'one sentence in Polish: what this map is' },
    series: {
      type: 'string',
      enum: [
        'messtischblatt',
        'wig25',
        'wig100',
        'kdr',
        'rosyjska',
        'austriacka',
        'inna',
        'nieznana',
      ],
    },
    year: nullable({ type: 'integer' }),
    sheetNumber: nullable({
      type: 'string',
      description: 'as printed, e.g. "4968" or "P46 S34 E"',
    }),
    legibility: { type: 'string', enum: ['dobra', 'srednia', 'slaba'] },
    frameCorners: {
      description: 'the four corners of the printed map frame when all are visible, else null',
      anyOf: [
        {
          type: 'object',
          properties: { nw: point, ne: point, se: point, sw: point },
          required: ['nw', 'ne', 'se', 'sw'],
          additionalProperties: false,
        },
        { type: 'null' },
      ],
    },
    placeNames: {
      type: 'array',
      description:
        'every name printed on the map at its label centre: villages, hamlets, estates, mills, mountains, rocks, streams, forests; settlements first',
      items: {
        type: 'object',
        properties: { text: { type: 'string' }, x: { type: 'number' }, y: { type: 'number' } },
        required: ['text', 'x', 'y'],
        additionalProperties: false,
      },
    },
    objects: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: [...MAP_OBJECT_KINDS] },
          label: { type: 'string', description: 'text written next to it, or ""' },
          x: { type: 'number', description: 'centre, 0 = left edge, 1 = right edge' },
          y: { type: 'number', description: 'centre, 0 = top edge, 1 = bottom edge' },
          confidence: { type: 'number' },
        },
        required: ['kind', 'label', 'x', 'y', 'confidence'],
        additionalProperties: false,
      },
    },
  },
  required: [
    'summary',
    'series',
    'year',
    'sheetNumber',
    'legibility',
    'frameCorners',
    'placeNames',
    'objects',
  ],
  additionalProperties: false,
} as const;

export const TEXT_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string', description: 'one sentence in Polish: what the text is about' },
    objects: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: ['osada', 'droga', 'mlyn', 'karczma', 'brod', 'inne'] },
          label: { type: 'string', description: 'short quote from the text' },
          anchor: {
            type: 'string',
            description:
              'the nearest named place to locate it from, e.g. "Kowary" or "kościół w Kowarach"',
          },
          anchorKind: { type: 'string', enum: ['miejscowosc', 'kosciol', 'rzeka', 'gora', 'inne'] },
          direction: { type: 'string', enum: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'brak'] },
          distanceM: nullable({ type: 'number' }),
          confidence: { type: 'number' },
        },
        required: ['kind', 'label', 'anchor', 'anchorKind', 'direction', 'distanceM', 'confidence'],
        additionalProperties: false,
      },
    },
  },
  required: ['summary', 'objects'],
  additionalProperties: false,
} as const;

export function mapInstruction(view: ViewBbox | null): string {
  const hint = view
    ? `The sender was looking at the area ${view.south.toFixed(3)}–${view.north.toFixed(3)}°N, ${view.west.toFixed(3)}–${view.east.toFixed(3)}°E when sending; the map is probably there.`
    : 'The location is unknown.';
  return `This image is a historical map (or a photo of one). ${hint}
Identify the series, year and sheet number if printed. Give the four corners of the printed map frame if all are visible.
List every name printed on the map with its label centre: villages, hamlets, estates, mountains, rocks, streams and forests, settlements first. They are used to place the map on today's map, so read them exactly as printed and do not leave any out.
List every building and every named or symbolised place of historical interest (kinds: ${MAP_OBJECT_KINDS.join(', ')}).
Positions are fractions of the image: x from 0 (left) to 1 (right), y from 0 (top) to 1 (bottom).`;
}

export function textInstruction(text: string | null, link: string | null): string {
  return `Read this historical source and list the places it mentions that may be gone today: mills, inns, fords, old roads, vanished villages, farmsteads. For each, give the nearest named place to locate it from, the direction and the distance if the text says so.
${link ? `Link given by the sender (not opened): ${link}\n` : ''}Text:
"""
${text ?? ''}
"""`;
}
