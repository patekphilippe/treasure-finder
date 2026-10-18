/** Largest image kept: phones refuse bigger canvases (iOS ~16.7 Mpx). */
export const OWN_MAP_MAX_PIXELS = 16_000_000;
/** A scan without a sheet number first covers this share of the view… */
export const SCAN_START_SHARE = 0.5;
/** …shifted up by this share of the view height, clear of the fitting bar at the bottom. */
export const SCAN_START_LIFT = 0.15;
export const IMAGE_EXT = /\.(tiff?|jpe?g|png|webp)$/i;
export const WORLD_EXT = /\.(jgw|jpgw|pgw|pngw|tfw|tifw|wld|j2w)$/i;
export const OWN_MAP_ACCEPT =
  '.tif,.tiff,.jpg,.jpeg,.png,.webp,.jgw,.jpgw,.pgw,.pngw,.tfw,.tifw,.wld,image/*';

export const METHOD_LABEL = {
  geotiff: 'GeoTIFF',
  worldfile: 'world file',
  corners: 'dopasowana narożnikami',
} as const;
