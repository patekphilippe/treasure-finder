// Data model from docs/PLAN.md ("Model danych"). Type values and field names
// must match the plan exactly — they are part of the export format.
import type { Geometry, MultiPolygon, Polygon } from 'geojson';

export type PointType = 'anomalia' | 'sprawdzic' | 'znalezisko' | 'niewybuch' | 'inne';

export type PointStatus = 'do_sprawdzenia' | 'pusto' | 'znalezisko' | 'chroniony' | 'odrzucony';

export type FormClass =
  | 'kopiec_okragly'
  | 'zaglebienie_okragle'
  | 'zaglebienie_prostokatne'
  | 'row_liniowy'
  | 'wal_liniowy'
  | 'pierscien'
  | 'nieokreslony';

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
  form: FormClass;
  lat: number;
  lng: number;
  areaM2: number;
  lengthM: number;
  widthM: number;
  /** signed: + convex, - concave */
  reliefM: number;
  circularity: number;
  elongation: number;
  rectangularity: number;
  /** 0–100 */
  score: number;
  /** looks like an archaeological monument — never a search target */
  protectedLikely: boolean;
  decision: CandidateDecision;
  note: string;
}

/** store: context — features digitised from archival maps */
export interface ContextFeature {
  id: string;
  kind: 'osada' | 'droga' | 'mlyn' | 'karczma' | 'brod' | 'inne';
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
export interface RasterRecord {
  id: string;
  sheetId: string;
  kind: 'hillshade' | 'slope' | 'lrm';
  data: Float32Array | Blob;
  created: number;
}

/** Categories of places found by the uneven-ground analysis (the first three are auto-suggested). */
export type AreaCategory =
  'skupisko' | 'liniowe' | 'pojedyncze' | 'wyrobisko' | 'naturalne' | 'ciekawe' | 'nieistotne';

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
  category: AreaCategory;
  /** category still the automatic suggestion (not set by the user) */
  auto: boolean;
  note: string;
  created: number;
  updated: number;
}
