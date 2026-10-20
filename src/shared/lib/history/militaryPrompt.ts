import { MILITARY_OBJECT_KINDS } from './types';

/** Structured output of the military profile: as READ_SCHEMA, plus the points of line objects. */
export const MILITARY_SCHEMA = {
  type: 'object',
  properties: {
    objects: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: [...MILITARY_OBJECT_KINDS] },
          label: { type: 'string', description: 'text written next to it on the map, or ""' },
          x: {
            type: 'number',
            description: 'centre (or middle of a line), image pixels from the left',
          },
          y: {
            type: 'number',
            description: 'centre (or middle of a line), image pixels from the top',
          },
          line: {
            type: 'array',
            description: 'points along a line object, image pixels; empty for a point object',
            items: {
              type: 'object',
              properties: { x: { type: 'number' }, y: { type: 'number' } },
              required: ['x', 'y'],
              additionalProperties: false,
            },
          },
          confidence: { type: 'number', description: 'from 0 to 1' },
        },
        required: ['kind', 'label', 'x', 'y', 'line', 'confidence'],
        additionalProperties: false,
      },
    },
  },
  required: ['objects'],
  additionalProperties: false,
} as const;

export const militaryPrompt = (w: number, h: number, res: number) =>
  `This is a crop of a Second World War military map, ${w} × ${h} pixels, north up, 1 pixel = ${res.toFixed(1)} m. A printed topographic base (towns, roads, rivers, forests, contour lines, grid) carries a military situation drawn or overprinted in colour: Soviet maps draw their own forces in red and the enemy in blue, German maps the other way round.

Report only the military situation, never the printed base:
- front line, forward edge of defence or a defence line (a long line, often with small teeth, semicircles or ticks) → "linia_frontu";
- trenches, trench lines, anti-tank ditches, fortified lines (thin zigzag or toothed lines) → "okopy";
- firing positions: artillery and mortar batteries, gun and machine-gun positions, bunkers, strongpoints (small symbols, often a circle or an arc with a tail, with a calibre or unit number) → "stanowisko";
- command posts, headquarters and observation posts (a flag or triangle on a staff, with a unit designation) → "dowodzenie";
- crossings, field bridges and ferries over rivers → "przeprawa";
- minefields, wire and other obstacles (rows of small circles, dots or crosses) → "pole_minowe";
- graves, military cemeteries and burial places → "mogila";
- anything else military worth knowing on the ground (airfield, depot, field hospital, assembly area) → "inne".

Do not report movement arrows, boundaries between units, captions, the map title or stamps. For a line object give "line" as 2 to 30 points following it in image pixels (x to the right, y down) and its middle in "x" and "y"; for a point object give its centre in "x" and "y" and an empty "line". In "label" put the text written next to it as you read it (unit numbers such as "254 сд" stay in their original script), or "". Rate how sure you are in "confidence". Answer with the objects in the required JSON format.`;
