import { describe, expect, it } from 'vitest';
import {
  snapFrame,
  type FrameQuad,
  type GrayWindow,
  type PixelRect,
} from '@/shared/lib/georef/snapFrame';

const W = 1600;
const H = 1200;
// the neatline (2 px, the line at the map) and the thicker line 5 px outside it, like a KdDR sheet
const NEAT = 101;
// the outer border of the sheet, ~2% of the longer side outside, and labels in the margin between
const BORDER = NEAT - 32;
const LABEL = NEAT - 15;

/** deterministic noise in 0–1 */
const noise = (i: number, j: number) => {
  const v = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

/** inked where a rectangle inset by `inset` has its line of `width` pixels */
const onFrame = (u: number, v: number, inset: number, width: number) => {
  const inside = (a: number, size: number) => a >= inset && a < size - inset;
  const onSide = (a: number, size: number) =>
    (a >= inset && a < inset + width) || (a >= size - inset - width && a < size - inset);
  return (onSide(u, W) && inside(v, H)) || (onSide(v, H) && inside(u, W));
};

/**
 * A scanned sheet turned by `turnDeg`: outer border, margin with labels, the double map frame,
 * map content (symbols, a grid line 40 px inside the frame), and the map's frame corners.
 */
function sheet(turnDeg: number) {
  const a = (turnDeg * Math.PI) / 180;
  const [cx, cy] = [W / 2, H / 2];
  const toSheet = (x: number, y: number) => ({
    u: cx + (x - cx) * Math.cos(a) + (y - cy) * Math.sin(a),
    v: cy - (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a),
  });
  const toScan = (u: number, v: number) => ({
    x: cx + (u - cx) * Math.cos(a) - (v - cy) * Math.sin(a),
    y: cy + (u - cx) * Math.sin(a) + (v - cy) * Math.cos(a),
  });
  const data = new Uint8Array(W * H);
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i++) {
      const { u, v } = toSheet(i + 0.5, j + 0.5);
      const map = u > NEAT + 1 && u < W - NEAT - 1 && v > NEAT + 1 && v < H - NEAT - 1;
      const symbol = noise(Math.floor(u / 4), Math.floor(v / 4)) < 0.2;
      const grid = onFrame(u, v, NEAT + 40, 2);
      // a label in the margin above the middle of each side ("do Rogozna")
      const label =
        !map &&
        ((Math.abs(u - W / 2) < 90 && (Math.abs(v - LABEL) < 5 || Math.abs(v - (H - LABEL)) < 5)) ||
          (Math.abs(v - H / 2) < 90 &&
            (Math.abs(u - LABEL) < 5 || Math.abs(u - (W - LABEL)) < 5))) &&
        noise(Math.floor(u / 3), Math.floor(v / 3)) < 0.5;
      const ink =
        onFrame(u, v, BORDER, 4) ||
        onFrame(u, v, BORDER + 6, 1.5) ||
        onFrame(u, v, NEAT - 6, 3) ||
        onFrame(u, v, NEAT - 1, 2) ||
        (map && (symbol || grid)) ||
        label;
      data[j * W + i] = ink ? 40 + 30 * noise(i, j) : 215 + 25 * noise(j, i);
    }
  const read = (r: PixelRect): GrayWindow => {
    const out = new Uint8Array(r.width * r.height);
    for (let j = 0; j < r.height; j++)
      out.set(data.subarray((r.y + j) * W + r.x, (r.y + j) * W + r.x + r.width), j * r.width);
    return { x0: r.x, y0: r.y, width: r.width, height: r.height, data: out };
  };
  const quad = (inset: number): FrameQuad => [
    toScan(inset, inset),
    toScan(W - inset, inset),
    toScan(W - inset, H - inset),
    toScan(inset, H - inset),
  ];
  return { read, quad };
}

const off = (a: FrameQuad, b: FrameQuad) =>
  Math.max(...a.map((p, k) => Math.hypot(p.x - b[k]!.x, p.y - b[k]!.y)));
const moved = (q: FrameQuad, by: [number, number][]): FrameQuad =>
  q.map((p, k) => ({ x: p.x + by[k]![0], y: p.y + by[k]![1] })) as unknown as FrameQuad;

describe('snapping a read map frame to the scan', () => {
  const turned = sheet(0.4);
  const size = { width: W, height: H };

  it('a reading that took the outer border lands on the neatline, past the margin', () => {
    const read = moved(turned.quad(BORDER + 2), [
      [3, -2],
      [-2, 4],
      [2, 3],
      [-4, -1],
    ]);
    const snapped = snapFrame(turned.read, read, size)!;
    expect(off(snapped, turned.quad(NEAT))).toBeLessThan(1);
  });

  it('a reading a few pixels off goes onto the line, not onto a grid line inside the map', () => {
    const read = moved(turned.quad(NEAT), [
      [9, 7],
      [-8, 10],
      [-6, -9],
      [10, -5],
    ]);
    const snapped = snapFrame(turned.read, read, size)!;
    expect(off(snapped, turned.quad(NEAT))).toBeLessThan(1);
  });

  it('a straight scan as well', () => {
    const straight = sheet(0);
    const snapped = snapFrame(straight.read, straight.quad(BORDER), size)!;
    expect(off(snapped, straight.quad(NEAT))).toBeLessThan(1);
  });

  it('nothing to snap to on a blank image: no answer, the reading stays', () => {
    const blank = (r: PixelRect): GrayWindow => ({
      x0: r.x,
      y0: r.y,
      width: r.width,
      height: r.height,
      data: new Uint8Array(r.width * r.height).fill(230),
    });
    expect(snapFrame(blank, turned.quad(NEAT), size)).toBeNull();
  });
});
