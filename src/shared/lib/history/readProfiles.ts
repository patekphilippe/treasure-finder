import { MILITARY_SCHEMA, militaryPrompt } from './militaryPrompt';
import { READ_SCHEMA, readPrompt } from './readPrompt';
import { sheet100CheckPrompt } from './sheet100CheckPrompt';
import { SHEET100_SCHEMA, sheet100Prompt } from './sheet100Prompt';
import {
  MAP_OBJECT_KINDS,
  MILITARY_OBJECT_KINDS,
  SHEET100_OBJECT_KINDS,
  type ReadKind,
} from './types';

export type ReadProfileId = 'topo' | 'arkusz100' | 'arkusz100_sprawdz' | 'wojskowa';

/**
 * How Claude reads one kind of map: the instructions and legend (prompt), what it may report
 * (kinds, schema) and the scale it needs. The app picks one, the worker runs it; a new kind
 * of map is a new profile here (docs/BACKEND.md, "Profile odczytu").
 */
export interface ReadProfile {
  id: ReadProfileId;
  kinds: readonly ReadKind[];
  schema: object;
  prompt: (w: number, h: number, res: number) => string;
  /** coarsest metres per image pixel still worth reading */
  maxResM: number;
  /** answer length limit (line objects need more) */
  maxTokens: number;
}

export const READ_PROFILES: Record<ReadProfileId, ReadProfile> = {
  // houses on a 1:25 000 sheet are ~10 m: coarser than 2 m a pixel they vanish
  topo: {
    id: 'topo',
    kinds: MAP_OBJECT_KINDS,
    schema: READ_SCHEMA,
    prompt: readPrompt,
    maxResM: 2,
    maxTokens: 4096,
  },
  // 1:100 000 sheets (KdDR, WIG): houses are blocks, places abbreviations; read at the scan's
  // own ~8 m a pixel, a view up to ~12 km
  arkusz100: {
    id: 'arkusz100',
    kinds: SHEET100_OBJECT_KINDS,
    schema: SHEET100_SCHEMA,
    prompt: sheet100Prompt,
    maxResM: 8,
    maxTokens: 4096,
  },
  // the second look at one spot of a 1:100 000 sheet: an enlarged close-up, one object or none
  arkusz100_sprawdz: {
    id: 'arkusz100_sprawdz',
    kinds: SHEET100_OBJECT_KINDS,
    schema: SHEET100_SCHEMA,
    prompt: sheet100CheckPrompt,
    maxResM: 8,
    maxTokens: 512,
  },
  // operational maps are 1:50 000–1:100 000 and their symbols large: a view up to ~12 km
  wojskowa: {
    id: 'wojskowa',
    kinds: MILITARY_OBJECT_KINDS,
    schema: MILITARY_SCHEMA,
    prompt: militaryPrompt,
    maxResM: 8,
    maxTokens: 8192,
  },
};

export const isReadProfileId = (v: unknown): v is ReadProfileId =>
  typeof v === 'string' && Object.hasOwn(READ_PROFILES, v);
