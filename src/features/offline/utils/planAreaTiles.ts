import { TOPO_WMTS_2180 } from '@/shared/config/geoportalTopo';
import { NMT_SOURCE } from '@/shared/config/geoportalWmts2180';
import { ORTHO_MAX_NATIVE_ZOOM, ORTHO_WMTS_URL } from '@/shared/config/geoportalOrtho';
import { toEpsg2180 } from '@/shared/lib/geo';
import {
  latLngToTile,
  pickSourceTiles,
  tileToLatLng,
  type Wmts2180Source,
} from '@/shared/lib/tiles';
import type { Bounds } from '@/shared/store/useMapViewStore';
import {
  AREA_MAX_ZOOM,
  AREA_MIN_ZOOM,
  AVG_TILE_BYTES,
  MAX_AREA_TILES,
} from '../config/offlineAreas';

export interface XyzSource {
  url: string;
  maxNativeZoom: number;
}

export interface AreaLayers {
  ortho: boolean;
  nmt: boolean;
  topo: boolean;
  custom: readonly XyzSource[];
}

export interface AreaPlan {
  urls: string[];
  counts: { ortho: number; nmt: number; topo: number; custom: number };
  /** estimate before downloading */
  bytes: number;
  total: number;
  tooLarge: boolean;
}

const MAP_TILE_PX = 256;

const fillXyz = (template: string, z: number, x: number, y: number) =>
  template.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));

/** Map tiles (x, y) covering the bounds at zoom z. */
function tileRange(b: Bounds, z: number) {
  const nw = latLngToTile(b.north, b.west, z);
  const se = latLngToTile(b.south, b.east, z);
  return {
    x0: Math.floor(nw.x),
    x1: Math.floor(se.x),
    y0: Math.floor(nw.y),
    y1: Math.floor(se.y),
  };
}

/** EPSG:2180 tiles the map layer draws the area from, at every zoom (see pickSourceTiles). */
function sourceTiles(b: Bounds, source: Wmts2180Source, dpr: number): string[] {
  const out = new Set<string>();
  for (let z = AREA_MIN_ZOOM; z <= AREA_MAX_ZOOM; z++) {
    const r = tileRange(b, z);
    for (let x = r.x0; x <= r.x1; x++)
      for (let y = r.y0; y <= r.y1; y++) {
        const at = (dx: number, dy: number) => {
          const ll = tileToLatLng(x + dx, y + dy, z);
          const [e, n] = toEpsg2180(ll.lat, ll.lng);
          return { x: e, y: n };
        };
        const picked = pickSourceTiles(
          [at(0, 0), at(1, 0), at(0, 1), at(1, 1)],
          MAP_TILE_PX,
          dpr,
          source,
        );
        if (!picked) continue;
        const { level, range } = picked;
        for (let row = range.row0; row <= range.row1; row++)
          for (let col = range.col0; col <= range.col1; col++)
            out.add(source.tileUrl(level, row, col));
      }
  }
  return [...out];
}

/**
 * Every tile URL the map will request for the area at zooms 12–19: orthophoto and custom
 * XYZ tiles directly, NMT and the topographic map as the EPSG:2180 tiles their layers draw from.
 * Too large an area is only counted, never listed.
 */
export function planAreaTiles(b: Bounds, layers: AreaLayers, dpr: number): AreaPlan {
  let mapTiles = 0;
  for (let z = AREA_MIN_ZOOM; z <= AREA_MAX_ZOOM; z++) {
    const r = tileRange(b, z);
    mapTiles += (r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1);
  }
  const countFor = (maxNative: number) => {
    const zooms = new Set<number>();
    for (let z = AREA_MIN_ZOOM; z <= AREA_MAX_ZOOM; z++) zooms.add(Math.min(z, maxNative));
    let n = 0;
    for (const z of zooms) {
      const r = tileRange(b, z);
      n += (r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1);
    }
    return n;
  };
  const orthoCount = layers.ortho ? countFor(ORTHO_MAX_NATIVE_ZOOM) : 0;
  const customCount = layers.custom.reduce((s, l) => s + countFor(l.maxNativeZoom), 0);
  // EPSG:2180 layers need far fewer tiles than map tiles; huge areas are not enumerated
  const grid2180 = layers.nmt || layers.topo;
  const empty = { ortho: orthoCount, nmt: 0, topo: 0, custom: customCount };
  if (orthoCount + customCount > MAX_AREA_TILES || (grid2180 && mapTiles > MAX_AREA_TILES * 4)) {
    const total = orthoCount + customCount + (grid2180 ? mapTiles : 0);
    return { urls: [], counts: empty, bytes: 0, total, tooLarge: true };
  }

  const urls = new Set<string>();
  const add = (template: string, maxNative: number) => {
    for (let z = AREA_MIN_ZOOM; z <= AREA_MAX_ZOOM; z++) {
      const zz = Math.min(z, maxNative);
      const r = tileRange(b, zz);
      for (let x = r.x0; x <= r.x1; x++)
        for (let y = r.y0; y <= r.y1; y++) urls.add(fillXyz(template, zz, x, y));
    }
  };
  if (layers.ortho) add(ORTHO_WMTS_URL, ORTHO_MAX_NATIVE_ZOOM);
  for (const l of layers.custom) add(l.url, l.maxNativeZoom);

  const nmtUrls = layers.nmt ? sourceTiles(b, NMT_SOURCE, dpr) : [];
  const topoUrls = layers.topo ? sourceTiles(b, TOPO_WMTS_2180, dpr) : [];
  for (const u of [...nmtUrls, ...topoUrls]) urls.add(u);

  const counts = {
    ortho: orthoCount,
    nmt: nmtUrls.length,
    topo: topoUrls.length,
    custom: customCount,
  };
  const total = urls.size;
  const bytes =
    counts.ortho * AVG_TILE_BYTES.ortho +
    counts.nmt * AVG_TILE_BYTES.nmt +
    counts.topo * AVG_TILE_BYTES.topo +
    counts.custom * AVG_TILE_BYTES.custom;
  return { urls: [...urls], counts, bytes, total, tooLarge: total > MAX_AREA_TILES };
}
