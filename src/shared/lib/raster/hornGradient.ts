/**
 * Horn's 3×3 gradient at one cell: dz/dx towards the east and dz/dy towards the north
 * (row 0 is the northern edge). Edge cells reuse their nearest neighbours.
 */
export function hornGradient(
  dem: Float32Array,
  w: number,
  h: number,
  cell: number,
  x: number,
  y: number,
): [number, number] {
  const xl = x > 0 ? x - 1 : x;
  const xr = x < w - 1 ? x + 1 : x;
  const yu = y > 0 ? y - 1 : y;
  const yd = y < h - 1 ? y + 1 : y;
  const z = (cx: number, cy: number) => dem[cy * w + cx]!;
  const dx =
    (z(xr, yu) + 2 * z(xr, y) + z(xr, yd) - (z(xl, yu) + 2 * z(xl, y) + z(xl, yd))) /
    ((xr - xl) * 4 * cell);
  const dy =
    (z(xl, yu) + 2 * z(x, yu) + z(xr, yu) - (z(xl, yd) + 2 * z(x, yd) + z(xr, yd))) /
    ((yd - yu) * 4 * cell);
  return [dx || 0, dy || 0];
}
