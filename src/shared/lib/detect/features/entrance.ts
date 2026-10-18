import { components, cropMask, type Component } from '../components';
import { interpretConfig } from '../interpretConfig';
import { open } from '../morphology';

export interface Entrance {
  found: boolean;
  /** from the pit's centre towards the entrance (radians from east, CCW) */
  direction: number | null;
  /** body of the pit without narrow protrusions, cells */
  bodyCells: number;
}

/** Narrow notch (0.8–1.5 m) sticking out of one side: the entrance of a dugout. */
export function entrance(c: Component, w: number, cell: number, cfg = interpretConfig): Entrance {
  const crop = cropMask(c, w, 2);
  const r = Math.max(1, Math.round(cfg.entrance.widthToM / cell / 2));
  const body = open(crop.mask, crop.cw, crop.ch, r);
  const rest = new Uint8Array(crop.mask.length);
  let bodyCells = 0;
  let br = 0;
  let bc = 0;
  for (let k = 0; k < rest.length; k++) {
    if (body[k]) {
      bodyCells++;
      br += (k / crop.cw) | 0;
      bc += k % crop.cw;
    } else if (crop.mask[k]) rest[k] = 1;
  }
  if (bodyCells < 0.5 * c.cells.length) return { found: false, direction: null, bodyCells };
  const minLen = Math.ceil(cfg.entrance.minLengthM / cell);
  const parts = components(rest, crop.cw, crop.ch).filter((p) => {
    const len = Math.max(p.row1 - p.row0, p.col1 - p.col0) + 1;
    const wid = Math.min(p.row1 - p.row0, p.col1 - p.col0) + 1;
    return len >= minLen && wid * cell <= cfg.entrance.widthToM + cell;
  });
  if (parts.length !== 1) return { found: false, direction: null, bodyCells };
  const p = parts[0]!;
  let pr = 0;
  let pc = 0;
  for (const k of p.cells) {
    pr += (k / crop.cw) | 0;
    pc += k % crop.cw;
  }
  const direction = Math.atan2(
    -(pr / p.cells.length - br / bodyCells),
    pc / p.cells.length - bc / bodyCells,
  );
  return { found: true, direction, bodyCells };
}
