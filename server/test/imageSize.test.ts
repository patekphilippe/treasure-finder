import { describe, expect, it } from 'vitest';
import { imageSize } from '../src/pipeline/imageSize';

describe('imageSize', () => {
  it('reads PNG width and height from the IHDR chunk', () => {
    const png = new Uint8Array(32);
    png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
    png.set([0, 0, 0x02, 0xee, 0, 0, 0x01, 0xf4], 16); // 750 × 500
    expect(imageSize(png)).toEqual({ w: 750, h: 500 });
  });

  it('reads a baseline JPEG start-of-frame', () => {
    const jpg = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0, 0, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x04, 0x38, 0x07,
      0x80, 0, 0, 0,
    ]);
    expect(imageSize(jpg)).toEqual({ w: 1920, h: 1080 });
  });

  it('reads a lossy WebP header', () => {
    const webp = new Uint8Array(30);
    webp.set(
      [...'RIFF'].map((c) => c.charCodeAt(0)),
      0,
    );
    webp.set(
      [...'WEBPVP8 '].map((c) => c.charCodeAt(0)),
      8,
    );
    webp.set([0x20, 0x06, 0x58, 0x02], 26); // 1568 × 600
    expect(imageSize(webp)).toEqual({ w: 1568, h: 600 });
  });

  it('gives up on anything else', () => {
    expect(imageSize(new TextEncoder().encode('%PDF-1.7'))).toBeNull();
  });
});
