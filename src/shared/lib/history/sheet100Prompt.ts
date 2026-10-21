import { SHEET100_OBJECT_KINDS } from './types';

/** Structured output of the 1:100 000 profile: as READ_SCHEMA with its own kinds. */
export const SHEET100_SCHEMA = {
  type: 'object',
  properties: {
    objects: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: [...SHEET100_OBJECT_KINDS] },
          label: { type: 'string', description: 'the abbreviation or name printed by it, or ""' },
          x: { type: 'number', description: 'the symbol itself, image pixels from the left' },
          y: { type: 'number', description: 'the symbol itself, image pixels from the top' },
          confidence: { type: 'number', description: 'from 0 to 1' },
        },
        required: ['kind', 'label', 'x', 'y', 'confidence'],
        additionalProperties: false,
      },
    },
  },
  required: ['objects'],
  additionalProperties: false,
} as const;

export const sheet100Prompt = (w: number, h: number, res: number) =>
  `This is a crop of a 1:100 000 topographic sheet (German Karte des Deutschen Reiches or Polish WIG 1:100 000), ${w} × ${h} pixels, north up, 1 pixel = ${res.toFixed(1)} m. Villages are drawn as small black blocks along the roads, with the village name in large letters nearby; places are marked by a small symbol with an abbreviation printed next to it.

Report only these, each once:
- a village or hamlet: a group of house blocks → "wies", with its name in "label"; its position is the middle of the house blocks, NOT the name (names are printed beside or across the houses, often far off);
- mill: "M.", "Wm.", "Mühle", a small wheel or cog symbol → "mlyn";
- inn: "Whs.", "Wirtsh.", "Krug", "Kr.", "Kretscham", "Gasth.", "Karczma", "Kar." → "karczma";
- manor farm: "Gut", "Vw.", "Vorw.", "Dom.", "Folw.", "Fw." → "folwark";
- forester's house: "Fh.", "Försterei", "Forsth.", "Leśn." → "lesniczowka";
- brickworks: "Zgl.", "Ziegelei", "Cegl." → "cegielnia";
- church or chapel outside a village: a cross on a small circle or square, "K.", "Kap.", "Kpl." → "kosciol";
- glassworks: "Glash.", "Hütte", "Huta" → "huta";
- tar kiln: "Teerofen", "Smol." → "smolarnia";
- ford: "Furt", "Bród" → "brod".

For a place, x and y are the small symbol or the house block the abbreviation belongs to, not the letters; if there is no symbol, the start of the abbreviation. Do NOT report: village and town names on their own, field and forest names (Flurnamen), heights and spot numbers, gravel or sand pits ("Ksgr.", "Sgr.", "Lehmgr."), sheep farms ("Sch."), roads, railways, rivers, contour lines, hachures, tree symbols, grid lines, the sheet margin or its text. Report nothing you cannot tie to a printed symbol or abbreviation. Put the text you read in "label" and how sure you are in "confidence". Answer with the objects in the required JSON format.`;
