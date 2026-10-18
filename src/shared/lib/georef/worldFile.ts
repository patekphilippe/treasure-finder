import { affineHomography, type Homography } from './homography';

/**
 * A world file (.jgw, .pgw, .tfw, .wld): six lines A, D, B, E, C, F mapping the centre of pixel
 * (col, row) to x = A·col + B·row + C, y = D·col + E·row + F. Returned as a homography from the
 * pixel corner grid (0,0 = top-left corner of the image) to the file's coordinates.
 */
export function parseWorldFile(text: string): Homography {
  const v = text
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => Number(s.replace(',', '.')));
  if (v.length < 6 || v.slice(0, 6).some((n) => !Number.isFinite(n)))
    throw new Error('Plik world file musi mieć 6 liczb');
  const [A, D, B, E, C, F] = v as [number, number, number, number, number, number];
  // corner grid: pixel centre is at (col + 0.5, row + 0.5)
  return affineHomography(A, D, B, E, C - 0.5 * A - 0.5 * B, F - 0.5 * D - 0.5 * E);
}
