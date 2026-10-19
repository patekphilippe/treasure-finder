import { MAP_OBJECT_KINDS } from '@/shared/lib/history';

export const AI_MODELS = [
  { id: 'claude-haiku-5-5', label: 'Claude Haiku (szybszy, tańszy)' },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet (dokładniejszy)' },
] as const;
export type AiModelId = (typeof AI_MODELS)[number]['id'];

/** Longest side of the image sent (larger images are scaled down by the API anyway). */
export const AI_MAX_SIDE = 1568;
/** Houses on a 1:25 000 sheet are ~10 m: coarser than this the reading is pointless. */
export const AI_MAX_RES_M = 2;
/** Proposal rules: reading error absorbed, houses joined into one site, weak readings dropped. */
export const PROPOSAL_OPTIONS = { bufferM: 25, linkM: 80, minConfidence: 0.35 } as const;

export const API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Structured output (output_config.format): works on Haiku and Sonnet alike, where forcing a tool
 * (tool_choice "tool") is rejected by Sonnet 5.5. Supported JSON Schema subset only: every object
 * closed with additionalProperties false, all fields required, no minimum/maximum.
 */
export const READ_SCHEMA = {
  type: 'object',
  properties: {
    objects: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: [...MAP_OBJECT_KINDS] },
          label: { type: 'string', description: 'text written next to it on the map, or ""' },
          x: { type: 'number', description: 'centre, image pixels from the left' },
          y: { type: 'number', description: 'centre, image pixels from the top' },
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

export const readPrompt = (w: number, h: number, res: number) =>
  `This is a crop of a historical topographic map (for example a German Messtischblatt 1:25 000 or a Polish WIG map), ${w} × ${h} pixels, north up, 1 pixel = ${res.toFixed(1)} m.

Find:
- every building symbol (small filled or hatched rectangles and squares, often along roads) → kind "budynek", one entry per building;
- named or symbolised places: mill (Mühle, Wassermühle, M.) → "mlyn"; inn (Krug, Kretscham, Gasthaus, Wirtshaus) → "karczma"; manor farm (Vorwerk, Vw., Gut, Dominium, Domäne) → "folwark"; forester's house (Försterei, Forsthaus, Fh.) → "lesniczowka"; brickworks (Ziegelei, Zgl.) → "cegielnia"; smithy (Schmiede) → "kuznia"; church or chapel → "kosciol"; glassworks (Glashütte) → "huta"; tar kiln (Teerofen) → "smolarnia"; ford (Furt) → "brod"; anything else of historical interest → "inne".

Ignore letters and numbers themselves, contour lines, roads, field boundaries, tree and meadow symbols. Give each object's centre in image pixels (x to the right, y down) as precisely as you can, the text you read next to it in "label", and how sure you are in "confidence". Answer with the objects in the required JSON format.`;
