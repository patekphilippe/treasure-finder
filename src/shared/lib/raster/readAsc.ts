import type { DemGrid } from './demGrid';

/**
 * ESRI ASCII Grid (Geoportal NMT sheets): xllcorner or xllcenter, optional NODATA_value,
 * header keys in any case. Byte-level parser: a 4 × 4 km sheet is ~37 MB of text.
 */
export function readAsc(input: ArrayBuffer | Uint8Array): DemGrid {
  const b = input instanceof Uint8Array ? input : new Uint8Array(input);
  let i = 0;
  const n = b.length;
  const isSpace = (c: number) => c === 32 || c === 9 || c === 10 || c === 13 || c === 44;
  const skip = () => {
    while (i < n && isSpace(b[i]!)) i++;
  };
  const word = () => {
    skip();
    const s = i;
    while (i < n && !isSpace(b[i]!)) i++;
    return String.fromCharCode(...b.subarray(s, i));
  };
  const number = (): number => {
    skip();
    let sign = 1;
    if (b[i] === 45) {
      sign = -1;
      i++;
    } else if (b[i] === 43) i++;
    let v = 0;
    let c = b[i]!;
    while (c >= 48 && c <= 57) {
      v = v * 10 + (c - 48);
      c = b[++i]!;
    }
    if (c === 46) {
      let f = 0.1;
      c = b[++i]!;
      while (c >= 48 && c <= 57) {
        v += (c - 48) * f;
        f *= 0.1;
        c = b[++i]!;
      }
    }
    if (c === 101 || c === 69) {
      i++;
      let es = 1;
      if (b[i] === 45) {
        es = -1;
        i++;
      } else if (b[i] === 43) i++;
      let e = 0;
      c = b[i]!;
      while (c >= 48 && c <= 57) {
        e = e * 10 + (c - 48);
        c = b[++i]!;
      }
      v *= 10 ** (es * e);
    }
    return sign * v;
  };

  const header: Record<string, number> = {};
  for (;;) {
    skip();
    const c = b[i];
    if (c === undefined || !((c >= 65 && c <= 90) || (c >= 97 && c <= 122))) break;
    const key = word().toLowerCase();
    header[key] = number();
  }
  const w = header.ncols;
  const h = header.nrows;
  const cell = header.cellsize;
  if (!w || !h || !cell)
    throw new Error('To nie jest plik ESRI ASCII Grid (brak ncols, nrows lub cellsize)');
  const corner = header.xllcorner !== undefined;
  const xll = corner ? header.xllcorner! : (header.xllcenter ?? NaN) - cell / 2;
  const yll = corner ? (header.yllcorner ?? NaN) : (header.yllcenter ?? NaN) - cell / 2;
  if (!Number.isFinite(xll) || !Number.isFinite(yll))
    throw new Error('Brak xllcorner/xllcenter w nagłówku');
  const nodata = header.nodata_value;

  const dem = new Float32Array(w * h);
  for (let k = 0; k < w * h; k++) {
    skip();
    if (i >= n) throw new Error(`Plik jest niepełny: ${k} z ${w * h} wartości`);
    const v = number();
    dem[k] = nodata !== undefined && v === nodata ? NaN : v;
  }
  return { w, h, cell, originE: xll, originN: yll + h * cell, dem };
}
