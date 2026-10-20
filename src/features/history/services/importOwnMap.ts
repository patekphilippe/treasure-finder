import { createId } from '@/shared/lib/createId';
import { crsTransform, toEpsg2180 } from '@/shared/lib/geo';
import {
  affineHomography,
  applyHomography,
  fitHomography,
  parseWorldFile,
  sheetCorners,
  type Homography,
  type SheetSeries,
} from '@/shared/lib/georef';
import { yearsFromText } from '@/shared/lib/history';
import type { Bounds } from '@/shared/store/useMapViewStore';
import type { OwnMap } from '@/shared/types/domain';
import {
  IMAGE_EXT,
  OWN_MAP_MAX_PIXELS,
  SCAN_START_LIFT,
  SCAN_START_SHARE,
  WORLD_EXT,
} from '../config/ownMaps';
import { encodeImage } from '../utils/encodeImage';

/** The file has a georeference but no system the app knows: ask the user for it. */
export class NeedCrsError extends Error {}

export interface ImportOptions {
  /** system chosen by the user (world file, GeoTIFF without a known key) */
  epsg?: number;
  /** a scan: place it by its sheet number… */
  sheet?: { series: SheetSeries; number: string };
  /** …or at the corners the backend found (top-left, top-right, bottom-right, bottom-left)… */
  corners?: { lat: number; lng: number }[];
  /** …or in the middle of the current view */
  view?: Bounds | null;
  /** the year the map shows (read by the backend); else a single year in the file name */
  year?: number;
}

const corners = (w: number, h: number) => [
  { x: 0, y: 0 },
  { x: w, y: 0 },
  { x: w, y: h },
  { x: 0, y: h },
];

/** Scales a pixel → source map from the original image size to the kept one. */
const rescale = (h: Homography, sx: number, sy: number): number[] => [
  h[0]! / sx,
  h[1]! / sy,
  h[2]!,
  h[3]! / sx,
  h[4]! / sy,
  h[5]!,
  h[6]! / sx,
  h[7]! / sy,
  h[8]!,
];

function scanPlacement(w: number, h: number, opts: ImportOptions): Homography {
  if (opts.corners?.length === 4) {
    const dst = opts.corners.map(({ lat, lng }) => {
      const [x, y] = toEpsg2180(lat, lng);
      return { x, y };
    });
    return fitHomography(corners(w, h), dst);
  }
  if (opts.sheet) {
    const b = sheetCorners(opts.sheet.series, opts.sheet.number);
    if (!b) throw new Error('Nie rozpoznaję numeru arkusza');
    const dst = [
      [b.north, b.west],
      [b.north, b.east],
      [b.south, b.east],
      [b.south, b.west],
    ].map(([lat, lng]) => {
      const [x, y] = toEpsg2180(lat!, lng!);
      return { x, y };
    });
    return fitHomography(corners(w, h), dst);
  }
  const v = opts.view;
  if (!v) throw new Error('Przesuń mapę w okolicę skanu');
  const [x0, y0] = toEpsg2180(v.south, v.west);
  const [x1, y1] = toEpsg2180(v.north, v.east);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2 + (y1 - y0) * SCAN_START_LIFT;
  // keep the scan's proportions inside the share of the view
  const k = Math.min((x1 - x0) / w, (y1 - y0) / h) * SCAN_START_SHARE;
  return affineHomography(k, 0, 0, -k, cx - (w * k) / 2, cy + (h * k) / 2);
}

async function fromGeoTiff(file: File, opts: ImportOptions) {
  const { fromArrayBuffer } = await import('geotiff');
  const img = await (await fromArrayBuffer(await file.arrayBuffer())).getImage();
  const W = img.getWidth();
  const H = img.getHeight();
  let pixelToSource: Homography | null = null;
  try {
    const [ox, oy] = img.getOrigin() as [number, number];
    const [rx, ry] = img.getResolution() as [number, number];
    pixelToSource = affineHomography(rx, 0, 0, ry, ox, oy);
  } catch {
    // no georeference: a plain scan in a TIFF
  }
  const keys = img.getGeoKeys() ?? {};
  const keyEpsg = (keys.ProjectedCSTypeGeoKey ?? keys.GeographicTypeGeoKey) as number | undefined;
  const epsg = keyEpsg && crsTransform(keyEpsg) ? keyEpsg : opts.epsg;
  if (pixelToSource && !epsg) throw new NeedCrsError(keyEpsg ? `EPSG:${keyEpsg}` : '');

  const scale = Math.min(1, Math.sqrt(OWN_MAP_MAX_PIXELS / (W * H)));
  const w = Math.max(1, Math.round(W * scale));
  const h = Math.max(1, Math.round(H * scale));
  const rgb = (await img.readRGB({
    width: w,
    height: h,
    interleave: true,
  })) as unknown as ArrayLike<number>;
  const rgba = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    rgba[i * 4] = rgb[i * 3]!;
    rgba[i * 4 + 1] = rgb[i * 3 + 1]!;
    rgba[i * 4 + 2] = rgb[i * 3 + 2]!;
    rgba[i * 4 + 3] = 255;
  }
  const encoded = await encodeImage(
    (ctx) => ctx.putImageData(new ImageData(rgba, w, h), 0, 0),
    w,
    h,
  );
  return {
    ...encoded,
    pixelToSource: pixelToSource ? rescale(pixelToSource, w / W, h / H) : null,
    epsg: epsg ?? 2180,
  };
}

async function fromImage(file: File) {
  const bitmap = await createImageBitmap(file);
  const W = bitmap.width;
  const H = bitmap.height;
  const encoded = await encodeImage((ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h), W, H);
  bitmap.close();
  return { ...encoded, sx: encoded.width / W, sy: encoded.height / H };
}

/**
 * An own historical map from the chosen files: a GeoTIFF with its georeference, an image with a
 * world file (system chosen by the user), or a plain scan placed by sheet number or in the view,
 * to be fitted by dragging its corners. Returns the map and whether it still needs fitting.
 */
export async function importOwnMap(
  files: readonly File[],
  opts: ImportOptions,
): Promise<{ map: OwnMap; needsFit: boolean }> {
  const image = files.find((f) => IMAGE_EXT.test(f.name));
  if (!image) throw new Error('Wybierz plik mapy: GeoTIFF, JPG, PNG albo WebP');
  const world = files.find((f) => WORLD_EXT.test(f.name));
  const name = image.name.replace(/\.[^.]+$/, '');
  const named = yearsFromText(name);
  const year = opts.year ?? (named && named.from === named.to ? named.from : undefined);
  const base = {
    id: createId(),
    name,
    created: Date.now(),
    visible: true,
    opacity: 0.8,
    ...(year && { year }),
  };

  if (/\.tiff?$/i.test(image.name) && !world) {
    const t = await fromGeoTiff(image, opts);
    if (t.pixelToSource)
      return {
        map: {
          ...base,
          image: t.blob,
          width: t.width,
          height: t.height,
          pixelToSource: t.pixelToSource,
          epsg: t.epsg,
          method: 'geotiff',
        },
        needsFit: false,
      };
    const placed = scanPlacement(t.width, t.height, opts);
    return {
      map: {
        ...base,
        image: t.blob,
        width: t.width,
        height: t.height,
        pixelToSource: [...placed],
        epsg: 2180,
        method: 'corners',
      },
      needsFit: true,
    };
  }

  const img = await fromImage(image);
  if (world) {
    if (!opts.epsg || !crsTransform(opts.epsg)) throw new NeedCrsError('');
    const h = parseWorldFile(await world.text());
    return {
      map: {
        ...base,
        image: img.blob,
        width: img.width,
        height: img.height,
        pixelToSource: rescale(h, img.sx, img.sy),
        epsg: opts.epsg,
        method: 'worldfile',
      },
      needsFit: false,
    };
  }
  const placed = scanPlacement(img.width, img.height, opts);
  return {
    map: {
      ...base,
      image: img.blob,
      width: img.width,
      height: img.height,
      pixelToSource: [...placed],
      epsg: 2180,
      method: 'corners',
    },
    needsFit: true,
  };
}

/** The map's corners in EPSG:2180 (for fitting and bounds), whatever its own system. */
export function mapCorners2180(map: OwnMap): { x: number; y: number }[] {
  const crs = crsTransform(map.epsg)!;
  return corners(map.width, map.height).map((c) => {
    const s = applyHomography(map.pixelToSource, c);
    const [x, y] = crs.to2180(s.x, s.y);
    return { x, y };
  });
}
