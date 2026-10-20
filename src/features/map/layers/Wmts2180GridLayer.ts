import L from 'leaflet';
import { canvasDpr, type Wmts2180Source } from '@/shared/lib/tiles';
import { drawWmts2180Tile } from '../utils/drawWmts2180Tile';

/**
 * Shows an EPSG:2180 WMTS on the Web Mercator map: every map tile is a canvas onto which
 * the overlapping 2180 tiles are drawn (drawWmts2180Tile).
 */
export class Wmts2180GridLayer extends L.GridLayer {
  private readonly config: Wmts2180Source;

  constructor(config: Wmts2180Source, options?: L.GridLayerOptions) {
    super(options);
    this.config = config;
  }

  protected override createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
    const size = this.getTileSize();
    const dpr = canvasDpr();
    const canvas = document.createElement('canvas');
    canvas.width = size.x * dpr;
    canvas.height = size.y * dpr;
    const map = (this as unknown as { _map: L.Map })._map;
    void drawWmts2180Tile(canvas.getContext('2d')!, map, coords, size, dpr, this.config).then(() =>
      done(undefined, canvas),
    );
    return canvas;
  }
}
