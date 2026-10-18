// Data model from docs/PLAN.md ("Model danych"). Type values and field names
// must match the plan exactly — they are part of the export format.
import type { Geometry, MultiPolygon, Polygon } from 'geojson';

export type PointType = 'anomalia' | 'sprawdzic' | 'znalezisko' | 'niewybuch' | 'inne';

export type PointStatus = 'do_sprawdzenia' | 'pusto' | 'znalezisko' | 'chroniony' | 'odrzucony';

/** Geometry of a detected form (independent of what it means). */
export type FormKind =
  | 'pojedynczy_dol'
  | 'pojedynczy_kopiec'
  | 'skupisko'
  | 'linia'
  | 'pierscien'
  | 'podkowa'
  | 'platforma'
  | 'uklad_rownolegly';

/** What the form probably is. */
export type Interpretation =
  | 'zaginiona_osada'
  | 'oboz'
  | 'ziemianka'
  | 'okop'
  | 'stanowiska_strzeleckie'
  | 'stanowisko_sprzetu'
  | 'leje'
  | 'dawna_droga'
  | 'pola_dawne'
  | 'mielerz'
  | 'wyrobisko'
  | 'row_melioracyjny_graniczny'
  | 'kurhan'
  | 'grodzisko_waly'
  | 'wykrot'
  | 'naturalna_inna'
  | 'nieokreslona';

export type Priority = 'najwyzszy' | 'wysoki' | 'sredni' | 'niski' | 'chroniony' | 'naturalne';

export interface CandidateFlags {
  /** risk of unexploded ordnance */
  uxo: boolean;
  /** battlefield: war graves possible */
  warGraves: boolean;
}

export interface AlternativeInterpretation {
  interpretation: Interpretation;
  /** 0–1 */
  confidence: number;
}

/** store: points */
export interface FieldPoint {
  id: string;
  type: PointType;
  status: PointStatus;
  name: string;
  desc: string;
  depthCm: number | null;
  lat: number;
  lng: number;
  accM: number | null;
  src: 'gps' | 'mapa' | 'import' | 'analiza';
  /** set when the point was created from an analysis candidate */
  candidateId?: string;
  /** safety flags copied from the candidate (UXO, war graves) */
  flags?: CandidateFlags;
  /** key in the photos store (JPEG Blob) */
  photoId: string | null;
  created: number;
  updated: number;
}

export type TrackVertex = [lat: number, lng: number, t: number, accM: number];

/** store: tracks */
export interface Track {
  id: string;
  name: string;
  start: number;
  end: number | null;
  active: boolean;
  distM: number;
  segments: TrackVertex[][];
}

export interface AnalysisWeights {
  relief: number;
  shape: number;
  context: number;
}

export interface AnalysisParams {
  /** LRM smoothing radius in metres (5–30) */
  lrmRadiusM: number;
  /** LRM threshold for convex/concave masks in metres (0.10–0.80) */
  thresholdM: number;
  minAreaM2: number;
  maxAreaM2: number;
  weights: AnalysisWeights;
}

/** store: sheets — NMT sheet metadata */
export interface Sheet {
  id: string;
  name: string;
  crs: 'EPSG:2180';
  cellSize: number;
  cols: number;
  rows: number;
  /** top-left corner in EPSG:2180 */
  originX: number;
  originY: number;
  boundsWgs84: [[number, number], [number, number]];
  params: AnalysisParams;
  created: number;
}

export type CandidateDecision = 'nowy' | 'przyjety' | 'odrzucony';

/** store: candidates */
export interface Candidate {
  id: string;
  sheetId: string;
  form: FormKind;
  interpretation: Interpretation;
  /** 0–1 */
  confidence: number;
  /** the next two interpretations */
  alternatives: AlternativeInterpretation[];
  priority: Priority;
  flags: CandidateFlags;
  /** why, in plain Polish */
  reasons: string[];
  lat: number;
  lng: number;
  areaM2: number;
  lengthM: number;
  widthM: number;
  /** signed: + convex, − concave */
  reliefM: number;
  /** 0–100 */
  score: number;
  /** outline of the form, WGS84 */
  outline: Polygon | MultiPolygon | null;
  /** where to search, WGS84; null for protected and natural forms */
  searchZone: Polygon | MultiPolygon | null;
  /** protected forms: outline + buffer, becomes a forbidden zone */
  exclusionZone: Polygon | MultiPolygon | null;
  decision: CandidateDecision;
  note: string;
  /** result of an older analysis: recompute the sheet */
  needsRecompute?: boolean;
}

/** store: context — features digitised from archival maps */
export interface ContextFeature {
  id: string;
  kind: 'osada' | 'droga' | 'mlyn' | 'karczma' | 'brod' | 'inne';
  geometry: Geometry;
  source: string;
}

/** store: water, lines and areas of water from BDOT10k (public data, not in the backup) */
export interface WaterFeature {
  id: string;
  geometry: Geometry;
  source: string;
}

/** store: zones (stage 2) */
export interface Zone {
  id: string;
  name: string;
  kind: 'zgoda' | 'zakaz';
  geometry: Polygon | MultiPolygon;
  permitNo?: string;
  owner?: string;
  validUntil?: number;
}

/** localStorage, as in version 1 */
export interface CustomLayer {
  id: string;
  name: string;
  kind: 'xyz' | 'wms';
  url: string;
  layers?: string;
  maxNativeZoom: number;
  opacity: number;
  on: boolean;
}

/** store: rasters — derived analysis rasters cached between reloads */
export type ReliefKind = 'hillshade' | 'slope' | 'lrm';

export interface RasterRecord {
  id: string;
  sheetId: string;
  kind: ReliefKind;
  /** an image (WebP or PNG) on the sheet's EPSG:2180 grid */
  data: Float32Array | Blob;
  /** EPSG:2180 of the image's top-left corner and metres per image pixel */
  originE?: number;
  originN?: number;
  res?: number;
  created: number;
}

/** store: areas, a place marked by the uneven-ground analysis */
export interface RoughArea {
  id: string;
  /** sequential number shown on the map and in the list */
  no: number;
  lat: number;
  lng: number;
  areaM2: number;
  /** 0–100 mean intensity */
  strength: number;
  /** length / width of the place (1 = round) */
  elongation: number;
  note: string;
  created: number;
  updated: number;
}
