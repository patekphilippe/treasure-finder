import type { DemGrid } from './demGrid';

/** Single-band GeoTIFF in EPSG:2180 (north-up). */
export async function readGeoTiff(input: ArrayBuffer): Promise<DemGrid> {
  const { fromArrayBuffer } = await import('geotiff');
  const tiff = await fromArrayBuffer(input);
  const image = await tiff.getImage();
  const epsg = image.getGeoKeys()?.ProjectedCSTypeGeoKey;
  if (epsg !== undefined && epsg !== 2180)
    throw new Error(`Arkusz jest w EPSG:${epsg}, potrzebny EPSG:2180`);
  const [originE, originN] = image.getOrigin() as [number, number];
  const [rx, ry] = image.getResolution() as [number, number];
  if (Math.abs(Math.abs(rx) - Math.abs(ry)) > 1e-6 || ry > 0)
    throw new Error('Obsługiwane są tylko kwadratowe komórki, północ u góry');
  const w = image.getWidth();
  const h = image.getHeight();
  const raw = (await image.readRasters({
    samples: [0],
    interleave: true,
  })) as unknown as ArrayLike<number>;
  const nodata = image.getGDALNoData();
  const dem = new Float32Array(w * h);
  for (let k = 0; k < w * h; k++) {
    const v = raw[k]!;
    dem[k] = nodata !== null && v === nodata ? NaN : v;
  }
  return { w, h, cell: Math.abs(rx), originE, originN, dem };
}
