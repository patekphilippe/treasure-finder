export interface RoughnessHotspot {
  lat: number;
  lng: number;
  areaM2: number;
  /** 0–100 */
  strength: number;
}

/** Heat image on the EPSG:2180 grid of the analysed mosaic. */
export interface RoughnessRaster {
  image: ImageBitmap;
  /** EPSG:2180 of the image's top-left corner */
  originE: number;
  originN: number;
  /** metres per pixel */
  res: number;
}

export interface RoughnessResult {
  raster: RoughnessRaster;
  hotspots: RoughnessHotspot[];
  analysedAt: number;
}

export class ViewTooLargeError extends Error {}
