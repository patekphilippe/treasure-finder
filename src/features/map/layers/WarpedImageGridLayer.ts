import L from 'leaflet';
import type { CrsTransform } from '@/shared/lib/geo';
import { getProj4 } from '@/shared/lib/geo/crs';
import { applyHomography, invertHomography, type Homography } from '@/shared/lib/georef';
import { canvasDpr } from '@/shared/lib/tiles';
import { warpCells, type TileToImage } from '../utils/warpCells';

export interface WarpedImage {
  image: CanvasImageSource;
  /** the image's size in pixels (the units of `sourceToPixel`) */
  width: number;
  height: number;
  /** coordinates in the image's system → image pixels */
  sourceToPixel: Homography;
  crs: CrsTransform;
}

/** the sign of the homography's denominator over the image itself; the other sign is beyond its horizon */
const imageSide = (s: WarpedImage) => {
  const centre = applyHomography(invertHomography(s.sourceToPixel), {
    x: s.width / 2,
    y: s.height / 2,
  });
  const h = s.sourceToPixel;
  return Math.sign(h[6]! * centre.x + h[7]! * centre.y + h[8]!);
};

/**
 * An own map (scan or GeoTIFF) in any supported system, warped onto each map tile: tile points
 * are converted exactly and the image drawn with the affine maps they fix (utils/warpCells).
 */
export class WarpedImageGridLayer extends L.GridLayer {
  private source: WarpedImage;
  private side: number;

  constructor(source: WarpedImage, options?: L.GridLayerOptions) {
    super(options);
    this.source = source;
    this.side = imageSide(source);
  }

  setSource(source: WarpedImage): void {
    this.source = source;
    this.side = imageSide(source);
    this.redraw();
  }

  protected override createTile(coords: L.Coords): HTMLElement {
    const size = this.getTileSize();
    const dpr = canvasDpr();
    const canvas = document.createElement('canvas');
    canvas.width = size.x * dpr;
    canvas.height = size.y * dpr;
    const map = (this as unknown as { _map: L.Map })._map;
    const { sourceToPixel: h, crs } = this.source;
    const proj = getProj4();
    const nw = coords.scaleBy(size);
    const toImage: TileToImage = (px, py) => {
      const ll = map.unproject([nw.x + px, nw.y + py], coords.z);
      const [ex, ny] = proj('EPSG:4326', 'EPSG:2180', [ll.lng, ll.lat]) as [number, number];
      const [x, y] = crs.from2180(ex, ny);
      const w = h[6]! * x + h[7]! * y + h[8]!;
      if (Math.sign(w) !== this.side) return null;
      return applyHomography(h, { x, y });
    };
    const cells = warpCells(toImage, size.x, this.source.width, this.source.height);
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    for (const c of cells) {
      ctx.save();
      if (c.size < size.x) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.beginPath();
        ctx.rect(c.x, c.y, c.size, c.size);
        ctx.clip();
      }
      const { a, b, c: cc, d, e, f } = c.m;
      ctx.setTransform(a * dpr, b * dpr, cc * dpr, d * dpr, e * dpr, f * dpr);
      ctx.drawImage(this.source.image, 0, 0);
      ctx.restore();
    }
    return canvas;
  }
}
