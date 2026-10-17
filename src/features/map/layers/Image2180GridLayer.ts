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

  setSource(source: Image2180 | null): void {
    this.source = source;
    this.redraw();
  }

  protected override createTile(coords: L.Coords): HTMLElement {
    const size = this.getTileSize();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const canvas = document.createElement('canvas');
    canvas.width = size.x * dpr;
    canvas.height = size.y * dpr;
    const src = this.source;
    if (!src) return canvas;
    const map = (this as unknown as { _map: L.Map })._map;
    const [p0, p1, p2] = tileCorners2180(map, coords, size);
    const t = projectedImageTransform(
      metresToTilePixels(p0, p1, p2, size.x),
      src.originE,
      src.originN,
      src.res,
      dpr,
    );
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.setTransform(t.a, t.b, t.c, t.d, t.e, t.f);
    ctx.drawImage(src.image, 0, 0);
    return canvas;
  }
}
