import L from 'leaflet';
import type { CrsTransform } from '@/shared/lib/geo';
import { imageToTileAffine, type Homography } from '@/shared/lib/georef';
import { canvasDpr } from '@/shared/lib/tiles';
import { tileCorners2180 } from '../utils/tileCorners2180';

export interface WarpedImage {
  image: CanvasImageSource;
  /** coordinates in the image's system → image pixels */
  sourceToPixel: Homography;
  crs: CrsTransform;
}

/**
 * An own map (scan or GeoTIFF) in any supported system, warped onto each map tile: the tile's
 * corners are converted exactly and the image drawn with the affine map they fix.
 */
export class WarpedImageGridLayer extends L.GridLayer {
  private source: WarpedImage;

  constructor(source: WarpedImage, options?: L.GridLayerOptions) {
    super(options);
    this.source = source;
  }

  setSource(source: WarpedImage): void {
    this.source = source;
    this.redraw();
  }

  protected override createTile(coords: L.Coords): HTMLElement {
    const size = this.getTileSize();
    const dpr = canvasDpr();
    const canvas = document.createElement('canvas');
    canvas.width = size.x * dpr;
    canvas.height = size.y * dpr;
    const map = (this as unknown as { _map: L.Map })._map;
    const [p0, p1, p2] = tileCorners2180(map, coords, size);
    const m = imageToTileAffine([p0, p1, p2], this.source.sourceToPixel, this.source.crs, size.x);
    if (![m.a, m.b, m.c, m.d, m.e, m.f].every(Number.isFinite)) return canvas;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.setTransform(m.a * dpr, m.b * dpr, m.c * dpr, m.d * dpr, m.e * dpr, m.f * dpr);
    ctx.drawImage(this.source.image, 0, 0);
    return canvas;
  }
}
