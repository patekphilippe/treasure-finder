import { describe, expect, it } from 'vitest';
import { entrance } from '@/shared/lib/detect/features/entrance';
import { topRoughness, uphill, uphillCutM2 } from '@/shared/lib/detect/features/mound';
import { profileAgainstSurroundings, spoilAround } from '@/shared/lib/detect/features/pit';
import { ringShape } from '@/shared/lib/detect/features/ringShape';
import { angleDiff } from '@/shared/lib/detect/geom';
import { probe } from '../../helpers/probe';
import { cone, dome, horseshoe, mound, notchX, rectPit, rim, Terrain } from '../../helpers/terrain';

const deg = (a: number) => (a * 180) / Math.PI;

describe('spoil sectors', () => {
  it('crater: rim all round, completeness ≥ 0.75', () => {
    const t = new Terrain().add(cone(100, 100, 6, 1)).add(rim(100, 100, 3.2, 6, 0.4));
    const { s, c, row, col } = probe(t, 100, 100, 'concave');
    const sp = spoilAround(s, c, row, col);
    expect(sp.completeness).toBeGreaterThanOrEqual(0.75);
  });

  it('uprooted tree: mound on one side, most mass in two sectors, touching', () => {
    // mound east of the pit
    // root plate rises right at the edge of the pit
    const t = new Terrain().add(cone(100, 100, 4, 0.8)).add(mound(103.6, 100, 5, 0.8));
    const { s, c, row, col } = probe(t, 100, 100, 'concave');
    const sp = spoilAround(s, c, row, col);
    expect(sp.topPairShare).toBeGreaterThanOrEqual(0.6);
    expect(sp.touching).toBe(true);
    expect(deg(angleDiff(sp.direction!, 0))).toBeLessThan(30);
  });

  it('no spoil around a plain pit', () => {
    const t = new Terrain().add(rectPit(100, 100, 5, 4, 1));
    const { s, c, row, col } = probe(t, 100, 100, 'concave');
    expect(spoilAround(s, c, row, col).completeness).toBe(0);
  });
});

describe('profile against the surroundings', () => {
  it('cone has a pointed bottom, a dugout a flat one', () => {
    const coneT = new Terrain().add(cone(100, 100, 8, 1.2));
    const p1 = probe(coneT, 100, 100, 'concave');
    expect(profileAgainstSurroundings(p1.s, p1.c, -1).deepShare).toBeLessThan(0.15);
    const dug = new Terrain().add(rectPit(100, 100, 5, 4, 1));
    const p2 = probe(dug, 100, 100, 'concave');
    const prof = profileAgainstSurroundings(p2.s, p2.c, -1);
    expect(prof.deepShare).toBeGreaterThan(0.4);
    expect(prof.maxM).toBeCloseTo(1, 0);
  });
});

describe('mound top', () => {
  it('dome is curved, a level platform is flat', () => {
    const domeT = new Terrain().add(dome(100, 100, 15, 1));
    const d = probe(domeT, 100, 100, 'convex');
    const pd = profileAgainstSurroundings(d.s, d.c, 1);
    expect(topRoughness(d.s, d.c, pd.plane!, pd.maxM)).toBeGreaterThan(0.12);

    const plat = new Terrain();
    const level = plat.plane(100) + 0.5;
    plat.each((x, y, i) => {
      if (Math.hypot(x - 100, y - 100) <= 6) plat.z[i] = level + (plat.z[i]! - plat.plane(x));
    });
    const p = probe(plat, 100, 100, 'convex');
    const pp = profileAgainstSurroundings(p.s, p.c, 1);
    expect(topRoughness(p.s, p.c, pp.plane!, pp.maxM)).toBeLessThan(0.12);
  });

  it('finds a cut on the uphill side (terrain rises to the east)', () => {
    const t = new Terrain().add(dome(100, 100, 12, 0.6)).add((x, y) => {
      const r = Math.hypot(x - 100, y - 100);
      return r > 6.5 && r < 9 && x > 103 ? -0.5 : 0;
    });
    const { s, c, row, col } = probe(t, 100, 100, 'convex');
    const prof = profileAgainstSurroundings(s, c, 1);
    const up = uphill(prof.plane!);
    expect(deg(angleDiff(up!, 0))).toBeLessThan(10);
    expect(uphillCutM2(s, c, row, col, up)).toBeGreaterThan(5);
  });
});

describe('ring and horseshoe', () => {
  it('horseshoe open to the south: 5–7 sectors, opening ≈ south', () => {
    const t = new Terrain().add(horseshoe(100, 100, 10, 2.5, 0.6, -Math.PI / 2));
    const { c, s } = probe(t, 100, 95.8, 'convex');
    const r = ringShape(c, s.w);
    expect(r.coveredSectors).toBeGreaterThanOrEqual(5);
    expect(r.coveredSectors).toBeLessThanOrEqual(7);
    expect(deg(angleDiff(r.openingDir!, -Math.PI / 2))).toBeLessThan(30);
  });

  it('closed ring covers all 8 sectors', () => {
    const t = new Terrain().add(rim(100, 100, 15, 20, 0.8));
    const { c, s } = probe(t, 117.5, 100, 'convex');
    expect(ringShape(c, s.w).coveredSectors).toBe(8);
  });
});

describe('dugout entrance', () => {
  it('finds the notch on the east side, none on a plain rectangle', () => {
    const t = new Terrain()
      .add(rectPit(100, 100, 5, 4, 1))
      .add(notchX(102.5, 104.5, 100, 1, 0.7, 0.4));
    const { c, s } = probe(t, 100, 100, 'concave');
    const e = entrance(c, s.w, s.cell);
    expect(e.found).toBe(true);
    expect(deg(angleDiff(e.direction!, 0))).toBeLessThan(20);
    const plain = probe(new Terrain().add(rectPit(100, 100, 5, 4, 1)), 100, 100, 'concave');
    expect(entrance(plain.c, plain.s.w, plain.s.cell).found).toBe(false);
  });
});
