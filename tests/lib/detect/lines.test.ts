import { describe, expect, it } from 'vitest';
import { lineFeatures } from '@/shared/lib/detect/features/lines';
import { angleDiff } from '@/shared/lib/detect/geom';
import { probe } from '../../helpers/probe';
import { Terrain, trench } from '../../helpers/terrain';

const deg = (a: number) => (a * 180) / Math.PI;
const zigzag: [number, number][] = Array.from({ length: 16 }, (_, k) => [
  25 + k * 10,
  k % 2 ? 105 : 95,
]);

function features(t: Terrain, x: number, y: number) {
  const { s, c } = probe(t, x, y, 'concave');
  return lineFeatures(s, c);
}

describe('line features', () => {
  it('zigzag trench with a parapet on the north side', () => {
    // in the terrain helper y grows southwards; side −1 = north of an eastward trench
    const f = features(new Terrain().add(trench(zigzag, 1.5, 1, -1)), 25, 95);
    expect(f.zigzagPer10m).toBeGreaterThanOrEqual(0.3);
    expect(f.parapetSide).not.toBe(0);
    expect(deg(angleDiff(f.parapetDir!, Math.PI / 2))).toBeLessThan(60);
    expect(f.lengthM).toBeGreaterThan(120);
    expect(f.widthM).toBeGreaterThan(1);
    expect(f.widthM).toBeLessThan(2.5);
  });

  it('straight ditch down the slope: straight, no zigzag, constant fall, no parapet', () => {
    const f = features(
      new Terrain().add(
        trench(
          [
            [20, 100],
            [180, 100],
          ],
          1.2,
          0.8,
          0,
        ),
      ),
      100,
      100,
    );
    expect(f.zigzagPer10m).toBe(0);
    expect(f.tortuosity).toBeLessThan(1.08);
    expect(f.monotonicShare).toBeGreaterThanOrEqual(0.85);
    expect(f.gradient).toBeGreaterThan(0.02); // 2° ≈ 3.5 %
    expect(f.parapetSide).toBe(0);
    expect(f.angleToSlopeDeg).toBeLessThan(10);
  });

  it('wide road cut oblique to the slope: U profile, ~45° to the fall line', () => {
    const f = features(
      new Terrain().add(
        trench(
          [
            [30, 170],
            [170, 30],
          ],
          4,
          0.8,
          0,
        ),
      ),
      100,
      100,
    );
    expect(f.uShare).toBeGreaterThanOrEqual(0.3);
    expect(f.angleToSlopeDeg).toBeGreaterThan(30);
    expect(f.angleToSlopeDeg).toBeLessThan(60);
  });

  it('a ditch along a contour is ~90° to the fall line', () => {
    const f = features(
      new Terrain().add(
        trench(
          [
            [100, 20],
            [100, 180],
          ],
          1.2,
          0.8,
          0,
        ),
      ),
      100,
      100,
    );
    expect(f.angleToSlopeDeg).toBeGreaterThan(80);
  });

  it('real bends vs zigzag teeth: an L-shaped trench has one major bend, a zigzag none', () => {
    const l = features(
      new Terrain().add(
        trench(
          [
            [30, 150],
            [110, 150],
            [110, 40],
          ],
          1.5,
          1,
          0,
        ),
      ),
      70,
      150,
    );
    expect(l.majorTurns.length).toBeGreaterThanOrEqual(1);
    const near = l.majorTurns.some(([x, y]) => Math.hypot(x - 110, y + 150) < 20);
    expect(near).toBe(true);
    const z = features(new Terrain().add(trench(zigzag, 1.5, 1, -1)), 25, 95);
    expect(z.majorTurns).toHaveLength(0);
  });
});
