/**
 * Width and height from the first bytes of a PNG, JPEG or WebP file, without decoding it
 * (the worker has no image library and little CPU time). Null for anything else.
 */
export function imageSize(bytes: Uint8Array): { w: number; h: number } | null {
  const b = bytes;
  const u16be = (i: number) => (b[i]! << 8) | b[i + 1]!;
  const u16le = (i: number) => b[i]! | (b[i + 1]! << 8);
  const u24le = (i: number) => b[i]! | (b[i + 1]! << 8) | (b[i + 2]! << 16);
  const u32be = (i: number) =>
    ((b[i]! << 24) >>> 0) + (b[i + 1]! << 16) + (b[i + 2]! << 8) + b[i + 3]!;
  // PNG: signature, then the IHDR chunk
  if (b.length >= 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47)
    return { w: u32be(16), h: u32be(20) };
  // WebP: RIFF....WEBP and one of three chunk kinds
  if (
    b.length >= 30 &&
    String.fromCharCode(...b.subarray(0, 4)) === 'RIFF' &&
    String.fromCharCode(...b.subarray(8, 12)) === 'WEBP'
  ) {
    const kind = String.fromCharCode(...b.subarray(12, 16));
    if (kind === 'VP8X') return { w: u24le(24) + 1, h: u24le(27) + 1 };
    if (kind === 'VP8L') {
      const bits = b[21]! | (b[22]! << 8) | (b[23]! << 16) | (b[24]! << 24);
      return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (kind === 'VP8 ') return { w: u16le(26) & 0x3fff, h: u16le(28) & 0x3fff };
    return null;
  }
  // JPEG: walk the segments to a start-of-frame marker
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return null;
      const marker = b[i + 1]!;
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc)
        return { h: u16be(i + 5), w: u16be(i + 7) };
      i += 2 + u16be(i + 2);
    }
  }
  return null;
}
