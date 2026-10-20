export interface FloatTiff {
  w: number;
  h: number;
  /** row by row from the top; NODATA cells are NaN */
  data: Float32Array;
}

const TAG = {
  width: 256,
  height: 257,
  bitsPerSample: 258,
  compression: 259,
  stripOffsets: 273,
  samplesPerPixel: 277,
  stripByteCounts: 279,
  planar: 284,
  tileWidth: 322,
  sampleFormat: 339,
  gdalNodata: 42113,
} as const;

/**
 * Uncompressed single-band float32 TIFF in strips, as the GUGiK NMT WCS returns it (the
 * backend reads heights with it; no library, so the worker stays small). Other layouts throw.
 */
export function readFloatTiff(buf: ArrayBuffer): FloatTiff {
  const view = new DataView(buf);
  const order = view.getUint16(0);
  if (order !== 0x4949 && order !== 0x4d4d) throw new Error('To nie jest plik TIFF');
  const le = order === 0x4949;
  if (view.getUint16(2, le) !== 42) throw new Error('BigTIFF nie jest obsługiwany');

  const ifd = view.getUint32(4, le);
  const count = view.getUint16(ifd, le);
  const tags = new Map<number, number[]>();
  let nodataText = '';
  for (let i = 0; i < count; i++) {
    const at = ifd + 2 + i * 12;
    const tag = view.getUint16(at, le);
    const type = view.getUint16(at + 2, le);
    const n = view.getUint32(at + 4, le);
    const size = type === 3 ? 2 : type === 4 ? 4 : 1;
    const inline = n * size <= 4;
    const base = inline ? at + 8 : view.getUint32(at + 8, le);
    if (tag === TAG.gdalNodata && type === 2) {
      for (let k = 0; k < n; k++) nodataText += String.fromCharCode(view.getUint8(base + k));
      continue;
    }
    if (type !== 3 && type !== 4) continue;
    const values: number[] = [];
    for (let k = 0; k < n; k++)
      values.push(type === 3 ? view.getUint16(base + k * 2, le) : view.getUint32(base + k * 4, le));
    tags.set(tag, values);
  }
  const one = (tag: number, fallback?: number) => {
    const v = tags.get(tag)?.[0] ?? fallback;
    if (v === undefined) throw new Error(`Brak znacznika TIFF ${tag}`);
    return v;
  };

  const w = one(TAG.width);
  const h = one(TAG.height);
  if (
    one(TAG.bitsPerSample) !== 32 ||
    one(TAG.sampleFormat, 1) !== 3 ||
    one(TAG.compression, 1) !== 1 ||
    one(TAG.samplesPerPixel, 1) !== 1 ||
    one(TAG.planar, 1) !== 1 ||
    tags.has(TAG.tileWidth)
  )
    throw new Error('Obsługiwany jest tylko nieskompresowany TIFF float32 w pasach');

  const offsets = tags.get(TAG.stripOffsets) ?? [];
  const lengths = tags.get(TAG.stripByteCounts) ?? [];
  const nodata = nodataText ? Number(nodataText.replace(/\0/g, '').trim()) : NaN;
  const data = new Float32Array(w * h);
  let k = 0;
  for (let s = 0; s < offsets.length; s++)
    for (let b = 0; b < lengths[s]! && k < data.length; b += 4) {
      const v = view.getFloat32(offsets[s]! + b, le);
      data[k++] = v === nodata ? NaN : v;
    }
  if (k !== data.length) throw new Error('Plik TIFF jest niepełny');
  return { w, h, data };
}
