export type BaseLayerId = 'osm' | 'ortho';

export const BASE_LAYER_OPTIONS: readonly { id: BaseLayerId; label: string; icon: string }[] = [
  { id: 'osm', label: 'Mapa', icon: 'map' },
  { id: 'ortho', label: 'Ortofotomapa', icon: 'satellite' },
];
