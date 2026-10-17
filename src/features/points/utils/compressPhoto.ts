import { PHOTO_JPEG_QUALITY, PHOTO_MAX_SIDE } from '../config/photo';
import { fitWithin } from './fitWithin';

/** Resizes a camera photo to max 1600 px and re-encodes it as JPEG 0.82. */
export async function compressPhoto(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const { width, height } = fitWithin(bitmap.width, bitmap.height, PHOTO_MAX_SIDE);
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D niedostępny');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.convertToBlob({ type: 'image/jpeg', quality: PHOTO_JPEG_QUALITY });
}
