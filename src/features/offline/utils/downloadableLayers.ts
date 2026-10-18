import type { CustomLayer } from '@/shared/types/domain';

/**
 * Custom layers that can be saved: XYZ with a fixed host. A `{s}` template spreads tiles over
 * servers at random, so a saved tile would rarely be the one the map asks for.
 */
export const downloadableLayers = (layers: readonly CustomLayer[]) =>
  layers.filter((l) => l.kind === 'xyz' && !l.url.includes('{s}'));
