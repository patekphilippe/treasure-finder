import type { ContextFeature } from '@/shared/types/domain';
import { PROPOSAL_OPTIONS } from './aiReading';

export type ContextKind = ContextFeature['kind'];

export const CONTEXT_KINDS: Record<ContextKind, { label: string; icon: string; color: string }> = {
  osada: { label: 'Osada, zabudowa', icon: 'home', color: '#b45309' },
  droga: { label: 'Dawna droga', icon: 'road', color: '#78716c' },
  mlyn: { label: 'Młyn', icon: 'cog', color: '#0e7490' },
  karczma: { label: 'Karczma', icon: 'beer', color: '#a21caf' },
  brod: { label: 'Bród', icon: 'water', color: '#2563eb' },
  inne: { label: 'Inny obiekt', icon: 'map-pin', color: '#4d7c0f' },
  wojsko: { label: 'Pozycje wojskowe', icon: 'bomb', color: '#b91c1c' },
  grob_wojenny: { label: 'Mogiła wojenna', icon: 'cross', color: '#374151' },
};

export const CONTEXT_KIND_ORDER: readonly ContextKind[] = [
  'osada',
  'mlyn',
  'karczma',
  'brod',
  'droga',
  'wojsko',
  'grob_wojenny',
  'inne',
];

/** `source` of objects marked by hand without a historical map on */
export const MANUAL_SOURCE = 'zaznaczone ręcznie';

/** the same object on another map may be drawn this far off (as far as a site's buildings link) */
export const SAME_OBJECT_M = PROPOSAL_OPTIONS.linkM;
/** on a map it was already seen on: a second reading of the same object, not a second object */
export const SAME_MAP_DUPLICATE_M = 40;
