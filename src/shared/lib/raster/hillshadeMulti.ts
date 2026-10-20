/** Grey stretch of the hillshade: flat ground (sin 35° ≈ 0.57) mid-grey, gentle slopes clearly lighter or darker. */
export const HILLSHADE_LO = 0.3;
export const HILLSHADE_HI = 0.85;

/**
 * Multi-directional hillshade (0–1): the light from `azimuths` directions at the given sun
 * altitude, averaged, so no single direction hides a form. The directions span a half circle
 * centred on `centreDeg` (north-west, the cartographic convention): over the full circle every
 * slope is lit from the front as much as from the back and the average flattens to a constant.
 *
 * Where the slope is gentler than the sun is high, no direction falls into shadow and the sum
 * has a closed form; only steeper cells loop over the directions. Same result, ~20× faster
 * (the backend renders map tiles with it).
 */
export function hillshadeMulti(
  dem: Float32Array,
  w: number,
  h: number,
  cell: number,
  azimuths = 16,
  altitudeDeg = 35,
  centreDeg = 315,
): Float32Array {
  const zen = ((90 - altitudeDeg) * Math.PI) / 180;
  const cosZen = Math.cos(zen);
  const sinZen = Math.sin(zen);
  // east and north components of each light direction, clockwise from north over centre ± 90°
  const east = new Float64Array(azimuths);
  const north = new Float64Array(azimuths);
  let sumEast = 0;
  let sumNorth = 0;
  for (let k = 0; k < azimuths; k++) {
    const az = ((centreDeg - 90 + (180 * (k + 0.5)) / azimuths) * Math.PI) / 180;
    east[k] = Math.sin(az);
    north[k] = Math.cos(az);
    sumEast += east[k]!;
    sumNorth += north[k]!;
  }
  // gradient up to which every direction lights the cell from the front
  const litMax = cosZen / sinZen;
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    // Horn's 3×3 gradient; edge cells reuse their nearest neighbours (as hornGradient)
    const up = (y > 0 ? y - 1 : y) * w;
    const row = y * w;
    const down = (y < h - 1 ? y + 1 : y) * w;
    const spanY = ((y < h - 1 ? y + 1 : y) - (y > 0 ? y - 1 : y)) * 4 * cell;
    for (let x = 0; x < w; x++) {
      const l = x > 0 ? x - 1 : x;
      const r = x < w - 1 ? x + 1 : x;
      const dx =
        (dem[up + r]! +
          2 * dem[row + r]! +
          dem[down + r]! -
          (dem[up + l]! + 2 * dem[row + l]! + dem[down + l]!)) /
          ((r - l) * 4 * cell) || 0;
      const dy =
        (dem[up + l]! +
          2 * dem[up + x]! +
          dem[up + r]! -
          (dem[down + l]! + 2 * dem[down + x]! + dem[down + r]!)) /
          spanY || 0;
      const g2 = dx * dx + dy * dy;
      const cosSlope = 1 / Math.sqrt(1 + g2);
      let sum: number;
      if (g2 <= litMax * litMax) {
        // Σ cosZen·cosSlope + sinZen·sinSlope·(light · downhill), downhill = −(dx, dy)/g
        sum = cosSlope * (azimuths * cosZen - sinZen * (dx * sumEast + dy * sumNorth));
      } else {
        const g = Math.sqrt(g2);
        const flat = cosZen * cosSlope;
        const tilt = sinZen * g * cosSlope;
        const ux = -dx / g;
        const uy = -dy / g;
        sum = 0;
        for (let k = 0; k < azimuths; k++) {
          const lit = flat + tilt * (east[k]! * ux + north[k]! * uy);
          if (lit > 0) sum += lit;
        }
      }
      out[row + x] = sum / azimuths;
    }
  }
  return out;
}
