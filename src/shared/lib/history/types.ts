/** What the map reading may report (Polish ids, shared with the prompt and the tool schema). */
export const MAP_OBJECT_KINDS = [
  'budynek',
  'mlyn',
  'karczma',
  'folwark',
  'lesniczowka',
  'cegielnia',
  'kuznia',
  'kosciol',
  'huta',
  'smolarnia',
  'brod',
  'inne',
] as const;
export type MapObjectKind = (typeof MAP_OBJECT_KINDS)[number];

/** One object read from a map image, in image pixels (x right, y down). */
export interface MapObject {
  kind: MapObjectKind;
  /** text read next to it, e.g. "Mühle", may be empty */
  label: string;
  x: number;
  y: number;
  /** 0–1 */
  confidence: number;
}

/** The image's place on the EPSG:2180 grid: top-left corner and metres per pixel. */
export interface ImageGrid {
  originE: number;
  originN: number;
  res: number;
  w: number;
  h: number;
}
