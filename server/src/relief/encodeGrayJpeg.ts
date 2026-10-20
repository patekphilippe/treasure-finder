// Baseline JPEG, one grey component, standard luminance tables (ITU T.81 annex K).

const ZIGZAG = [
  0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40, 48, 41, 34, 27, 20,
  13, 6, 7, 14, 21, 28, 35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51, 58, 59, 52,
  45, 38, 31, 39, 46, 53, 60, 61, 54, 47, 55, 62, 63,
];
const LUMA_QUANT = [
  16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56,
  14, 17, 22, 29, 51, 87, 80, 62, 18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113,
  92, 49, 64, 78, 87, 103, 121, 120, 101, 72, 92, 95, 98, 112, 100, 103, 99,
];
const DC_BITS = [0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0];
const DC_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const AC_BITS = [0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 0x7d];
const AC_VALUES = [
  0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07,
  0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0,
  0x24, 0x33, 0x62, 0x72, 0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28,
  0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49,
  0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69,
  0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
  0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7,
  0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5,
  0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2,
  0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8,
  0xf9, 0xfa,
];

/** canonical Huffman codes: symbol → [code, length] */
function huffman(bits: number[], values: number[]): [number, number][] {
  const out: [number, number][] = [];
  let code = 0;
  let k = 0;
  for (let len = 1; len <= 16; len++) {
    for (let i = 0; i < bits[len - 1]!; i++) out[values[k++]!] = [code++, len];
    code <<= 1;
  }
  return out;
}
const DC_CODES = huffman(DC_BITS, DC_VALUES);
const AC_CODES = huffman(AC_BITS, AC_VALUES);
/** cos((2x + 1)uπ/16) · C(u)/2, row u */
const DCT = Float64Array.from({ length: 64 }, (_, i) => {
  const u = i >> 3;
  const x = i & 7;
  return (u ? 0.5 : Math.SQRT1_2 / 2) * Math.cos(((2 * x + 1) * u * Math.PI) / 16);
});

/**
 * Grey 8-bit pixels → baseline JPEG (IJG quality 1–100). A third of the work and size of an
 * RGB JPEG of the same grey picture; the backend's relief tiles use it.
 */
export function encodeGrayJpeg(
  gray: Uint8Array,
  w: number,
  h: number,
  quality: number,
): Uint8Array {
  const scale = quality < 50 ? 5000 / quality : 200 - 2 * quality;
  const quant = LUMA_QUANT.map((q) =>
    Math.min(255, Math.max(1, Math.floor((q * scale + 50) / 100))),
  );

  let out = new Uint8Array(16_384 + (w * h) / 4);
  let len = 0;
  const byte = (b: number) => {
    if (len === out.length) {
      const bigger = new Uint8Array(out.length * 2);
      bigger.set(out);
      out = bigger;
    }
    out[len++] = b;
  };
  const word = (v: number) => {
    byte(v >> 8);
    byte(v & 255);
  };
  const bytes = (list: number[]) => list.forEach(byte);

  word(0xffd8);
  word(0xffe0); // JFIF
  bytes([0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0]);
  word(0xffdb);
  word(67);
  byte(0);
  for (let k = 0; k < 64; k++) byte(quant[ZIGZAG[k]!]!);
  word(0xffc0);
  bytes([0, 11, 8]);
  word(h);
  word(w);
  bytes([1, 1, 0x11, 0]);
  word(0xffc4);
  word(2 + 17 + DC_VALUES.length + 17 + AC_VALUES.length);
  byte(0x00);
  bytes(DC_BITS);
  bytes(DC_VALUES);
  byte(0x10);
  bytes(AC_BITS);
  bytes(AC_VALUES);
  word(0xffda);
  bytes([0, 8, 1, 1, 0, 0, 63, 0]);

  // entropy-coded data, 0xFF stuffed with 0x00
  let acc = 0;
  let nbits = 0;
  const put = (code: number, n: number) => {
    acc = (acc << n) | code;
    nbits += n;
    while (nbits >= 8) {
      const b = (acc >> (nbits - 8)) & 255;
      byte(b);
      if (b === 255) byte(0);
      nbits -= 8;
    }
    acc &= (1 << nbits) - 1;
  };
  const category = (v: number) => {
    let a = Math.abs(v);
    let c = 0;
    while (a) {
      a >>= 1;
      c++;
    }
    return c;
  };
  const value = (v: number, c: number) => put(v < 0 ? v + (1 << c) - 1 : v, c);

  const block = new Float64Array(64);
  const rows = new Float64Array(64);
  const coef = new Int32Array(64);
  let prevDc = 0;
  for (let by = 0; by < h; by += 8)
    for (let bx = 0; bx < w; bx += 8) {
      // edge blocks repeat the last row and column
      for (let y = 0; y < 8; y++)
        for (let x = 0; x < 8; x++)
          block[y * 8 + x] = gray[Math.min(h - 1, by + y) * w + Math.min(w - 1, bx + x)]! - 128;
      // separable DCT: rows, then columns
      for (let y = 0; y < 8; y++)
        for (let u = 0; u < 8; u++) {
          let s = 0;
          for (let x = 0; x < 8; x++) s += DCT[u * 8 + x]! * block[y * 8 + x]!;
          rows[y * 8 + u] = s;
        }
      for (let v = 0; v < 8; v++)
        for (let u = 0; u < 8; u++) {
          let s = 0;
          for (let y = 0; y < 8; y++) s += DCT[v * 8 + y]! * rows[y * 8 + u]!;
          coef[v * 8 + u] = Math.round(s / quant[v * 8 + u]!);
        }

      const dc = coef[0]!;
      const diff = dc - prevDc;
      prevDc = dc;
      const dcCat = category(diff);
      put(...DC_CODES[dcCat]!);
      value(diff, dcCat);
      let run = 0;
      for (let k = 1; k < 64; k++) {
        const c = coef[ZIGZAG[k]!]!;
        if (!c) {
          run++;
          continue;
        }
        for (; run > 15; run -= 16) put(...AC_CODES[0xf0]!);
        const cat = category(c);
        put(...AC_CODES[(run << 4) | cat]!);
        value(c, cat);
        run = 0;
      }
      if (run) put(...AC_CODES[0]!);
    }
  if (nbits) put((1 << (8 - nbits)) - 1, 8 - nbits);
  word(0xffd9);
  return out.slice(0, len);
}
