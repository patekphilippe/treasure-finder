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
/** What a military map reading may report (the military profile, readProfiles). */
export const MILITARY_OBJECT_KINDS = [
  'linia_frontu',
  'okopy',
  'stanowisko',
  'dowodzenie',
  'przeprawa',
  'pole_minowe',
  'mogila',
  'inne',
] as const;
export type MapObjectKind = (typeof MAP_OBJECT_KINDS)[number];
export type MilitaryObjectKind = (typeof MILITARY_OBJECT_KINDS)[number];
/** anything a reading profile may report */
export type ReadKind = MapObjectKind | MilitaryObjectKind;

/** One object read from a map image, in image pixels (x right, y down). */
export interface MapObject<K extends string = MapObjectKind> {
  kind: K;
  /** text read next to it, e.g. "Mühle", may be empty */
  label: string;
  x: number;
  y: number;
  /** 0–1 */
  confidence: number;
  /** points along a line object (front line, trench), image pixels; absent for points */
  line?: { x: number; y: number }[];
}

/** The image's place on the EPSG:2180 grid: top-left corner and metres per pixel. */
export interface ImageGrid {
  originE: number;
  originN: number;
  res: number;
  w: number;
  h: number;
}
