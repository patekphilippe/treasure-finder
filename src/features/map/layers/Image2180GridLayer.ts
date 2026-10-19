import L from 'leaflet';
import { metresToTilePixels, projectedImageTransform } from '@/shared/lib/tiles';
import { tileCorners2180 } from '../utils/tileCorners2180';

export interface Image2180 {
  image: CanvasImageSource & { width: number; height: number };
  /** EPSG:2180 of the image's top-left corner */
  originE: number;
  originN: number;
  /** metres per pixel */
  res: number;
}

/** Shows one in-memory image on the EPSG:2180 grid, warped onto each map tile like the WMTS layer. */
export class Image2180GridLayer extends L.GridLayer {
  private source: Image2180 | null;

  constructor(source: Image2180 | null, options?: L.GridLayerOptions) {
    super(options);
    this.source = source;
  }

  /**
   * Repaints the tiles already on the map in place: a new image (a sharper one, a new view)
   * must not make Leaflet rebuild and fade in every tile, which flashes the base map through.
   */
  setSource(source: Image2180 | null): void {
    this.source = source;
    const tiles = (
      this as unknown as { _tiles?: Record<string, { el: HTMLCanvasElement; coords: L.Coords }> }
    )._tiles;
    if (!tiles) return;
    for (const t of Object.values(tiles)) this.paint(t.el, t.coords);
  }

  protected override createTile(coords: L.Coords): HTMLElement {
    const size = this.getTileSize();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const canvas = document.createElement('canvas');
    canvas.width = size.x * dpr;
    canvas.height = size.y * dpr;
    this.paint(canvas, coords);
    return canvas;
  }

  private paint(canvas: HTMLCanvasElement, coords: L.Coords): void {
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const src = this.source;
    const map = (this as unknown as { _map?: L.Map })._map;
    if (!src || !map) return;
    const size = this.getTileSize();
    const dpr = canvas.width / size.x;
    const [p0, p1, p2] = tileCorners2180(map, coords, size);
    const t = projectedImageTransform(
      metresToTilePixels(p0, p1, p2, size.x),
      src.originE,
      src.originN,
      src.res,
      dpr,
    );
    ctx.imageSmoothingEnabled = true;
    ctx.setTransform(t.a, t.b, t.c, t.d, t.e, t.f);
    ctx.drawImage(src.image, 0, 0);
  }
}
