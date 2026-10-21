import L from 'leaflet';
import { fromEpsg2180, type CrsTransform } from '@/shared/lib/geo';
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

/** a copy is used once the image is drawn smaller than this share of its size */
const MIP_BELOW = 0.6;
/** the smallest copy: 1/16 of the side */
const MIP_LEVELS = 4;
/** further out than this the map is not drawn: at a country's view a sheet is a smudge */
export const WARPED_MIN_ZOOM = 8;

/** The image's footprint on the map, so tiles beside it are never made. */
const footprint = (s: WarpedImage): L.LatLngBounds => {
  const back = invertHomography(s.sourceToPixel);
  return L.latLngBounds(
    [
      [0, 0],
      [s.width, 0],
      [s.width, s.height],
      [0, s.height],
    ].map(([x, y]) => {
      const p = applyHomography(back, { x: x!, y: y! });
      const [e, n] = s.crs.to2180(p.x, p.y);
      const [lat, lng] = fromEpsg2180(e, n);
      return [lat, lng] as [number, number];
    }),
  );
};

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
 * Only tiles over the image are made, and zoomed out a halved copy (down to 1/16) is drawn
 * instead of the full scan: drawing 16 Mpx into every tile made zooming stall.
 */
export class WarpedImageGridLayer extends L.GridLayer {
  private source: WarpedImage;
  private side: number;
  /** halved copies, made when first needed: [1/2, 1/4, …] */
  private mips: (HTMLCanvasElement | undefined)[] = [];

  constructor(source: WarpedImage, options?: L.GridLayerOptions) {
    // not `minZoom`: Leaflet would lock the whole map's zoom to it while the layer is on
    super({ ...options, bounds: footprint(source) });
    this.source = source;
    this.side = imageSide(source);
  }

  setSource(source: WarpedImage): void {
    this.source = source;
    this.side = imageSide(source);
    this.mips = [];
    (this.options as L.GridLayerOptions).bounds = footprint(source);
    this.redraw();
  }

  /** The image at 1/2^level of its side, each copy made from the one before (smoother). */
  private mip(level: number): CanvasImageSource {
    if (level === 0) return this.source.image;
    const made = this.mips[level - 1];
    if (made) return made;
    const prev = this.mip(level - 1);
    const k = 2 ** level;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(this.source.width / k));
    canvas.height = Math.max(1, Math.round(this.source.height / k));
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(prev, 0, 0, canvas.width, canvas.height);
    this.mips[level - 1] = canvas;
    return canvas;
  }

  protected override createTile(coords: L.Coords): HTMLElement {
    const size = this.getTileSize();
    const dpr = canvasDpr();
    const canvas = document.createElement('canvas');
    canvas.width = size.x * dpr;
    canvas.height = size.y * dpr;
    // a country's view: the sheet would be a smudge costing the whole scan
    if (coords.z < WARPED_MIN_ZOOM) return canvas;
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
      // how many screen pixels one image pixel takes: far below 1, a smaller copy looks the same
      const scale = Math.sqrt(Math.abs(a * d - b * cc)) * dpr;
      const level =
        scale >= MIP_BELOW ? 0 : Math.min(MIP_LEVELS, Math.floor(Math.log2(MIP_BELOW / scale)) + 1);
      const img = this.mip(level) as { width: number; height: number };
      // the copy's pixel in the image's pixels, per axis (its size was rounded)
      const kx = this.source.width / img.width;
      const ky = this.source.height / img.height;
      ctx.setTransform(a * dpr * kx, b * dpr * kx, cc * dpr * ky, d * dpr * ky, e * dpr, f * dpr);
      ctx.drawImage(img as CanvasImageSource, 0, 0);
      ctx.restore();
    }
    return canvas;
  }
}
