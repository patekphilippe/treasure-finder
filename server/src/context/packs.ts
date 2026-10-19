import type { SourceObject } from '@/shared/types/sources';

/** Packs cover 0.25° × 0.25° cells (about 28 × 17 km in Poland): small files, fetched by view. */
export const CELL_DEG = 0.25;
export const INDEX_KEY = 'kontekst/index.json';

export interface PackIndexEntry {
  key: string;
  bbox: { south: number; west: number; north: number; east: number };
  count: number;
  updated: number;
}

interface PackFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: {
    kind: SourceObject['kind'];
    label: string;
    radiusM: number;
    source: string;
    approved: number;
  };
}
interface Pack {
  type: 'FeatureCollection';
  features: PackFeature[];
}

export function cellKey(lat: number, lng: number): string {
  const s = Math.floor(lat / CELL_DEG) * CELL_DEG;
  const w = Math.floor(lng / CELL_DEG) * CELL_DEG;
  return `kontekst/${s.toFixed(2)}_${w.toFixed(2)}.geojson`;
}

function cellBbox(key: string): PackIndexEntry['bbox'] {
  const [s, w] = key.replace('kontekst/', '').replace('.geojson', '').split('_').map(Number) as [
    number,
    number,
  ];
  return { south: s, west: w, north: s + CELL_DEG, east: w + CELL_DEG };
}

/** Adds approved objects to their cells' packs and refreshes the index (read, merge, write). */
export async function publishObjects(
  bucket: R2Bucket,
  objects: readonly SourceObject[],
  source: string,
  now: number,
): Promise<string[]> {
  const byCell = new Map<string, SourceObject[]>();
  for (const o of objects)
    byCell.set(cellKey(o.lat, o.lng), [...(byCell.get(cellKey(o.lat, o.lng)) ?? []), o]);

  const indexObj = await bucket.get(INDEX_KEY);
  const index = indexObj ? ((await indexObj.json()) as PackIndexEntry[]) : [];
  for (const [key, list] of byCell) {
    const current = await bucket.get(key);
    const pack: Pack = current
      ? ((await current.json()) as Pack)
      : { type: 'FeatureCollection', features: [] };
    for (const o of list)
      pack.features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [Number(o.lng.toFixed(6)), Number(o.lat.toFixed(6))],
        },
        properties: { kind: o.kind, label: o.label, radiusM: o.radiusM, source, approved: now },
      });
    await bucket.put(key, JSON.stringify(pack), {
      httpMetadata: { contentType: 'application/geo+json' },
    });
    const entry = { key, bbox: cellBbox(key), count: pack.features.length, updated: now };
    const at = index.findIndex((e) => e.key === key);
    if (at >= 0) index[at] = entry;
    else index.push(entry);
  }
  await bucket.put(INDEX_KEY, JSON.stringify(index), {
    httpMetadata: { contentType: 'application/json' },
  });
  return [...byCell.keys()];
}
