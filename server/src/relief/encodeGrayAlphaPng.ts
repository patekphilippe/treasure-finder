const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 255]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

/**
 * Grey + alpha 8-bit pixels → PNG, rows filtered with "up" and deflated by the runtime's
 * CompressionStream. For relief tiles with transparent parts (the border, the sea).
 */
export async function encodeGrayAlphaPng(
  gray: Uint8Array,
  alpha: Uint8Array,
  w: number,
  h: number,
): Promise<Uint8Array> {
  const stride = w * 2 + 1;
  const raw = new Uint8Array(stride * h);
  for (let y = 0; y < h; y++) {
    raw[y * stride] = 2; // filter "up"
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const above = y ? i - w : -1;
      const at = y * stride + 1 + x * 2;
      raw[at] = (gray[i]! - (above >= 0 ? gray[above]! : 0)) & 255;
      raw[at + 1] = (alpha[i]! - (above >= 0 ? alpha[above]! : 0)) & 255;
    }
  }
  const zlib = new Uint8Array(
    await new Response(
      new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate')),
    ).arrayBuffer(),
  );
  const header = new Uint8Array(13);
  const hv = new DataView(header.buffer);
  hv.setUint32(0, w);
  hv.setUint32(4, h);
  header.set([8, 4, 0, 0, 0], 8); // 8 bits, grey + alpha, deflate, adaptive filters, no interlace
  const parts = [
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', zlib),
    chunk('IEND', new Uint8Array(0)),
  ];
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}
