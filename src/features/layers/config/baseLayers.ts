export type BaseLayerId = 'osm' | 'ortho' | 'topo';

export const BASE_LAYER_OPTIONS: readonly { id: BaseLayerId; label: string; icon: string }[] = [
  { id: 'osm', label: 'Mapa', icon: 'map' },
  { id: 'ortho', label: 'Ortofoto', icon: 'satellite' },
  { id: 'topo', label: 'Topo', icon: 'mountain' },
];
