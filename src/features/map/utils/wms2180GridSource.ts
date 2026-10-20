import { NMT_WMTS_2180 } from '@/shared/config/geoportalWmts2180';
import type { Wmts2180Source } from '@/shared/lib/tiles';

export interface Wms2180Request {
  url: string;
  layers: string;
  /** e.g. image/png8: same look as PNG for scans, a third of the size and twice as fast */
  format?: string;
  params?: Record<string, string>;
}

/** Scans of 1:25 000 sheets hold no detail finer than ~1.3 m (Geoportal grid level 10). */
const FINEST_LEVEL = 10;

/**
 * A slow EPSG:2180 WMS asked as a fixed grid of 512 px tiles (the Geoportal WMTS grid), not
 * as one image per view: every view asks the same addresses, so tiles already seen come from
 * memory and moving the map loads only the new edge.
 */
export function wms2180GridSource(wms: Wms2180Request): Wmts2180Source {
  const g = NMT_WMTS_2180;
  return {
    tileSize: g.tileSize,
    originEasting: g.originEasting,
    originNorthing: g.originNorthing,
    resolutions: g.resolutions.slice(0, FINEST_LEVEL + 1),
    matrixSize: g.matrixSize.slice(0, FINEST_LEVEL + 1),
    tileUrl: (level, row, col) => {
      const span = g.tileSize * g.resolutions[level]!;
      const e0 = g.originEasting + col * span;
      const n1 = g.originNorthing - row * span;
      const query = new URLSearchParams({
        SERVICE: 'WMS',
        VERSION: '1.3.0',
        REQUEST: 'GetMap',
        LAYERS: wms.layers,
        STYLES: '',
        CRS: 'EPSG:2180',
        // WMS 1.3.0 axis order for EPSG:2180: northing, easting
        BBOX: [n1 - span, e0, n1, e0 + span].map((v) => v.toFixed(2)).join(','),
        WIDTH: String(g.tileSize),
        HEIGHT: String(g.tileSize),
        FORMAT: wms.format ?? 'image/png',
        TRANSPARENT: 'true',
        ...wms.params,
      });
      return `${wms.url}?${query.toString()}`;
    },
  };
}
