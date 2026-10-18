import {
  cone,
  dome,
  horseshoe,
  mound,
  notchX,
  rectPit,
  ridges,
  rim,
  rng,
  Terrain,
  trench,
  valley,
} from './terrain';

/** The 12 synthetic models of the specification (x east, y south, metres). */
export const scenarios = {
  lej: () => new Terrain().add(cone(100, 100, 6, 1)).add(rim(100, 100, 3.2, 6, 0.4)),

  wykrot: () => new Terrain().add(cone(100, 100, 4, 0.8)).add(mound(103.6, 100, 5, 0.8)),

  /** 6 pits in a line along x, 7 m apart, spoil on the north side (smaller y) */
  stanowiska: () => {
    const t = new Terrain();
    for (let k = 0; k < 6; k++) {
      const x = 80 + 7 * k;
      t.add(cone(x, 100, 2.5, 0.8)).add(mound(x, 97.6, 3, 0.6));
    }
    return t;
  },

  /** zigzag trench running east, parapet on the north side */
  okop: () =>
    new Terrain().add(
      trench(
        Array.from({ length: 16 }, (_, k) => [25 + k * 10, k % 2 ? 105 : 95]),
        1.5,
        1,
        -1,
      ),
    ),

  /** straight ditch running east = down/up the slope: constant fall */
  melioracja: () =>
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

  ziemianka: (cx = 100, cy = 100) =>
    new Terrain().add(rectPit(cx, cy, 5, 4, 1)).add(notchX(cx + 3, cx + 5, cy, 1, 0.7, 0.4)),

  /** 4 dugouts within 60 m, stream hollow ~120 m east of their centre */
  oboz: () => {
    const t = new Terrain().add(valley(177, 15, 1.5));
    for (const [x, y] of [
      [40, 70],
      [70, 75],
      [45, 110],
      [75, 105],
    ] as const)
      t.add(rectPit(x, y, 5, 4, 1)).add(notchX(x + 3, x + 5, y, 1, 0.7, 0.4));
    return t;
  },

  kurhan: () => new Terrain().add(dome(100, 100, 15, 1)),

  /** level platform 12 m, raised above the downhill side, cut into the slope on the uphill (east) side */
  mielerz: () => {
    const t = new Terrain();
    const level = t.plane(100) + 0.5;
    t.each((x, y, i) => {
      if (Math.hypot(x - 100, y - 100) <= 6) t.z[i] = level + (t.z[i]! - t.plane(x));
    });
    return t.add((x, y) => {
      const r = Math.hypot(x - 100, y - 100);
      return r > 6.5 && r < 9 && x > 103 ? -0.5 : 0;
    });
  },

  /** horseshoe 10 m open to the south */
  podkowa: () => new Terrain().add(horseshoe(100, 100, 10, 2.5, 0.6, -Math.PI / 2)),

  pola: () => new Terrain().add(ridges(20, 180, 20, 180, 8, 0.2)),

  /** 40 windthrows on a jittered grid, random orientation */
  wykroty: () => {
    const t = new Terrain();
    const r = rng(5);
    let k = 0;
    for (let gy = 0; gy < 7 && k < 40; gy++)
      for (let gx = 0; gx < 6 && k < 40; gx++, k++) {
        const x = 28 + gx * 28 + (r() - 0.5) * 10;
        const y = 25 + gy * 24 + (r() - 0.5) * 8;
        const a = r() * 2 * Math.PI;
        t.add(cone(x, y, 4, 0.8)).add(mound(x + 3.6 * Math.cos(a), y - 3.6 * Math.sin(a), 5, 0.8));
      }
    return t;
  },
};
