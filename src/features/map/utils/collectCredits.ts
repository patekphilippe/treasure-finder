import type { Map as LeafletMap } from 'leaflet';

/** Credits of the layers on the map, each once, in the order the layers were added. */
export function collectCredits(map: Pick<LeafletMap, 'eachLayer'>): string[] {
  const credits = new Set<string>();
  map.eachLayer((layer) => {
    const text = layer.getAttribution?.();
    if (text) credits.add(text);
  });
  return [...credits];
}
