import type { ContextFeature } from '@/shared/types/domain';

export type ContextKind = ContextFeature['kind'];

export const CONTEXT_KINDS: Record<ContextKind, { label: string; icon: string; color: string }> = {
  osada: { label: 'Osada, zabudowa', icon: 'home', color: '#b45309' },
  droga: { label: 'Dawna droga', icon: 'road', color: '#78716c' },
  mlyn: { label: 'Młyn', icon: 'cog', color: '#0e7490' },
  karczma: { label: 'Karczma', icon: 'beer', color: '#a21caf' },
  brod: { label: 'Bród', icon: 'water', color: '#2563eb' },
  inne: { label: 'Inny obiekt', icon: 'map-pin', color: '#4d7c0f' },
};

export const CONTEXT_KIND_ORDER: readonly ContextKind[] = [
  'osada',
  'mlyn',
  'karczma',
  'brod',
  'droga',
  'inne',
];

/** `source` of objects marked by hand without a historical map on */
export const MANUAL_SOURCE = 'zaznaczone ręcznie';
