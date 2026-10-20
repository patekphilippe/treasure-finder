import { describe, expect, it } from 'vitest';
import { readFloatTiff } from '@/shared/lib/raster';

/** Minimal float32 TIFF in strips, laid out as the GUGiK WCS writes it. */
function floatTiff(
  w: number,
  h: number,
  values: number[],
  opts: { le?: boolean; rowsPerStrip?: number; nodata?: string; compression?: number } = {},
): ArrayBuffer {
  const le = opts.le ?? true;
  const rows = opts.rowsPerStrip ?? h;
  const strips = Math.ceil(h / rows);
  const entries: [number, number, number, number[] | string][] = [
    [256, 3, 1, [w]],
    [257, 3, 1, [h]],
    [258, 3, 1, [32]],
    [259, 3, 1, [opts.compression ?? 1]],
    [273, 4, strips, []],
    [277, 3, 1, [1]],
    [278, 3, 1, [rows]],
    [279, 4, strips, []],
    [339, 3, 1, [3]],
  ];
  if (opts.nodata) entries.push([42113, 2, opts.nodata.length + 1, `${opts.nodata}\0`]);
  const ifdAt = 8;
  const extraAt = ifdAt + 2 + entries.length * 12 + 4;
  const extraSize = 4 * strips * 2 + 64;
  const dataAt = extraAt + extraSize;
  const buf = new ArrayBuffer(dataAt + w * h * 4);
  const v = new DataView(buf);
  v.setUint16(0, le ? 0x4949 : 0x4d4d);
  v.setUint16(2, 42, le);
  v.setUint32(4, ifdAt, le);
  v.setUint16(ifdAt, entries.length, le);
  let extra = extraAt;
  const stripBytes = (s: number) => Math.min(rows, h - s * rows) * w * 4;
  entries.forEach(([tag, type, count, value], i) => {
    const at = ifdAt + 2 + i * 12;
    v.setUint16(at, tag, le);
    v.setUint16(at + 2, type, le);
    v.setUint32(at + 4, count, le);
    if (tag === 273 || tag === 279) {
      const list = Array.from({ length: strips }, (_, s) =>
        tag === 273 ? dataAt + s * rows * w * 4 : stripBytes(s),
      );
      if (strips === 1) v.setUint32(at + 8, list[0]!, le);
      else {
        v.setUint32(at + 8, extra, le);
        list.forEach((x, k) => v.setUint32(extra + k * 4, x, le));
        extra += strips * 4;
      }
    } else if (typeof value === 'string') {
      v.setUint32(at + 8, extra, le);
      for (let k = 0; k < value.length; k++) v.setUint8(extra + k, value.charCodeAt(k));
      extra += value.length;
    } else if (type === 3) v.setUint16(at + 8, value[0]!, le);
    else v.setUint32(at + 8, value[0]!, le);
  });
  values.forEach((x, k) => v.setFloat32(dataAt + k * 4, x, le));
  return buf;
}

describe('readFloatTiff', () => {
  const values = [1.5, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  it('reads a single strip, little-endian, row by row from the top', () => {
    const t = readFloatTiff(floatTiff(4, 3, values));
    expect([t.w, t.h]).toEqual([4, 3]);
    expect(Array.from(t.data)).toEqual(values);
  });

  it('reads several strips and big-endian files', () => {
    const t = readFloatTiff(floatTiff(4, 3, values, { le: false, rowsPerStrip: 1 }));
    expect(Array.from(t.data)).toEqual(values);
  });

  it('turns the GDAL NODATA value into NaN', () => {
    const t = readFloatTiff(floatTiff(2, 1, [-9999, 4], { nodata: '-9999' }));
    expect(Number.isNaN(t.data[0])).toBe(true);
    expect(t.data[1]).toBe(4);
  });

  it('refuses compressed files and other formats', () => {
    expect(() => readFloatTiff(floatTiff(2, 1, [1, 2], { compression: 5 }))).toThrow(
      /nieskompresowany/,
    );
    expect(() => readFloatTiff(new TextEncoder().encode('<html>').buffer)).toThrow(/TIFF/);
  });
});
