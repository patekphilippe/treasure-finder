/** Structured output of the legend reading: the entries as printed, sign and meaning. */
export const LEGEND_SCHEMA = {
  type: 'object',
  properties: {
    entries: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          sign: {
            type: 'string',
            description: 'the abbreviation, or how the symbol looks (e.g. "cross on a circle")',
          },
          meaning: { type: 'string', description: 'what the legend says it means, as printed' },
        },
        required: ['sign', 'meaning'],
        additionalProperties: false,
      },
    },
  },
  required: ['entries'],
  additionalProperties: false,
} as const;

export const legendPrompt = (w: number, h: number) =>
  `This is a piece of the margin of a historical topographic sheet, ${w} × ${h} pixels. If it shows the sheet's legend (Zeichenerklärung, Objaśnienie znaków topograficznych, Условные знаки), list its entries for: settlements and buildings, churches, chapels, crosses and cemeteries, mills and windmills, inns, manor farms, forester's houses, industry (brickworks, kilns, mines, glassworks), ruins, battlefields, towers, monuments and military objects. For each, "sign" is the abbreviation or a short description of how the symbol looks, "meaning" what the legend says, in its language. Skip roads, railways, water, vegetation, relief and boundaries. If there is no legend in this piece, answer with an empty "entries" list. Answer in the required JSON format.`;
