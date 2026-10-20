/**
 * Historical sources sent to the AI backend (server/, docs/BACKEND.md).
 * Shared by the app and the worker: the worker imports this file through the `@/` alias.
 */

/** objects the owner's panel ticks by default; in the test phase an admin's sources publish these */
export const PUBLISH_MIN_CONFIDENCE = 0.4;

/** 'public': to the shared base after review; 'private': only for the sender */
export type SubmissionMode = 'public' | 'private';

export type SubmissionStatus =
  | 'nowe'
  | 'w_kolejce'
  | 'gotowe'
  | 'do_przegladu'
  | 'zatwierdzone'
  | 'odrzucone'
  | 'czeka_na_budzet'
  | 'blad';

export interface ViewBbox {
  south: number;
  west: number;
  north: number;
  east: number;
}

/** Object proposed by the analysis, WGS84; becomes a ContextFeature once accepted. */
export interface SourceObject {
  kind: 'osada' | 'droga' | 'mlyn' | 'karczma' | 'brod' | 'inne';
  /** what the source says, e.g. "Mühle" or "młyn nad potokiem" */
  label: string;
  lat: number;
  lng: number;
  /** how far off the position may be */
  radiusM: number;
  /** 0–1 */
  confidence: number;
  /** Polish, shown to the user */
  reasons: string[];
}

export interface SubmissionResult {
  /** what the source turned out to be */
  summary: string;
  objects: SourceObject[];
  /** how the image was placed on the map, null when it could not be */
  georef: {
    method: 'arkusz' | 'nazwy' | 'reczne';
    rmsM: number | null;
    /** places found on today's map that the placement rests on */
    anchors?: string[];
  } | null;
}

/** Answer of POST /api/submissions */
export interface SubmissionCreated {
  id: string;
  /** keep it: the only way to read or delete the submission */
  accessKey: string;
  status: SubmissionStatus;
}

/** Answer of GET /api/submissions/:id */
export interface SubmissionView {
  id: string;
  mode: SubmissionMode;
  status: SubmissionStatus;
  createdAt: number;
  result: SubmissionResult | null;
  error: string | null;
}
