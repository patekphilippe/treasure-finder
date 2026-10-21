import type { ViewBbox } from '@/shared/types/sources';
import { FRAME_RULE, MAP_SCHEMA, SYSTEM_PROMPT } from '../pipeline/prompts';
import type { ImageQuestion } from '../readings/callClaude';

// the submissions pipeline's map schema without the objects: placing needs only the sheet,
// the frame and the names, and a short answer comes back while the user waits
const PLACEMENT_SCHEMA = {
  ...MAP_SCHEMA,
  properties: Object.fromEntries(
    Object.entries(MAP_SCHEMA.properties).filter(([key]) => key !== 'objects'),
  ),
  required: MAP_SCHEMA.required.filter((k) => k !== 'objects'),
};

/** What Claude is asked about a scan to place it (POST /api/placements). */
export function placementQuestion(view: ViewBbox | null): ImageQuestion {
  const hint = view
    ? `The user was looking at the area ${view.south.toFixed(3)}–${view.north.toFixed(3)}°N, ${view.west.toFixed(3)}–${view.east.toFixed(3)}°E; the map is probably there.`
    : 'The location is unknown.';
  return {
    system: SYSTEM_PROMPT,
    schema: PLACEMENT_SCHEMA,
    maxTokens: 4096,
    text: `This image is a historical map (or a photo of one) that the user wants to place on today's map. ${hint}
Identify the series, year, sheet number and sheet title if printed. ${FRAME_RULE}
List every name printed on the map with its label centre: villages, hamlets, estates, mountains, rocks, streams and forests, settlements first. They are used to place the map, so read them exactly as printed and do not leave any out.
Positions are fractions of the image: x from 0 (left) to 1 (right), y from 0 (top) to 1 (bottom).`,
  };
}
