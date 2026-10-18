import { describe, expect, it } from 'vitest';
import { detectForms, type Detection } from '@/shared/lib/detect/pipeline';
import { buildScene } from '@/shared/lib/detect/scene';
import { scenarios } from '../../helpers/scenarios';
import { dome, rectPit, Terrain, trench } from '../../helpers/terrain';

const run = (t: Terrain) => detectForms(buildScene(t.grid()));
const brief = (ds: Detection[]) =>
  ds.map((d) => `${d.interpretation}(${d.confidence.toFixed(2)})`).join(', ');
const only = (ds: Detection[], i: string) => {
  const hits = ds.filter((d) => d.interpretation === i);
  expect(hits, brief(ds)).toHaveLength(1);
  return hits[0]!;
};

describe('the 12 synthetic models', () => {
  it('1. crater with a full rim → leje', () => {
    const d = only(run(scenarios.lej()), 'leje');
    expect(d).toMatchObject({ priority: 'niski', flags: { uxo: true, warGraves: true } });
  });

  it('2. pit with a mound on one side → wykrot', () => {
    const d = only(run(scenarios.wykrot()), 'wykrot');
    expect(d).toMatchObject({ priority: 'naturalne', flags: { uxo: false, warGraves: false } });
    expect(d.zone.kind).toBe('none');
  });

  it('3. six pits in a line with spoil on one side → stanowiska_strzeleckie', () => {
    const ds = run(scenarios.stanowiska());
    const d = only(ds, 'stanowiska_strzeleckie');
    expect(d).toMatchObject({ priority: 'sredni', flags: { uxo: true, warGraves: true } });
    expect(d.reasons.join(' ')).toMatch(/6 dołów w linii co 7 m/);
    expect(
      ds.filter((x) => x.interpretation === 'wykrot'),
      brief(ds),
    ).toHaveLength(0);
  });

  it('4. zigzag trench with a parapet → okop', () => {
    const d = only(run(scenarios.okop()), 'okop');
    expect(d).toMatchObject({ priority: 'wysoki', flags: { uxo: true, warGraves: true } });
    expect(d.reasons.join(' ')).toMatch(/zygzak/);
  });

  it('5. straight ditch with a constant fall → row_melioracyjny_graniczny', () => {
    const d = only(run(scenarios.melioracja()), 'row_melioracyjny_graniczny');
    expect(d).toMatchObject({ priority: 'niski', flags: { uxo: false, warGraves: false } });
    expect(d.zone.kind).toBe('none');
  });

  it('6. rectangular flat pit with an entrance → ziemianka', () => {
    const d = only(run(scenarios.ziemianka()), 'ziemianka');
    expect(d).toMatchObject({ priority: 'wysoki', flags: { uxo: false, warGraves: false } });
    expect(d.reasons.join(' ')).toMatch(/wejścia po wschodniej stronie/);
  });

  it('7. four dugouts with a stream hollow 120 m away → oboz', () => {
    const ds = run(scenarios.oboz());
    const d = only(ds, 'oboz');
    expect(d).toMatchObject({ priority: 'najwyzszy', flags: { uxo: true } });
    expect(
      ds.filter((x) => x.interpretation === 'ziemianka'),
      brief(ds),
    ).toHaveLength(0);
  });

  it('8. dome 15 m, 1 m high → kurhan, protected, no search zone', () => {
    const d = only(run(scenarios.kurhan()), 'kurhan');
    expect(d.priority).toBe('chroniony');
    expect(d.zone.kind).toBe('none');
    expect(d.exclusion?.bufferM).toBe(20);
  });

  it('9. flat platform cut into the slope → mielerz', () => {
    const d = only(run(scenarios.mielerz()), 'mielerz');
    expect(d.priority).toBe('niski');
    expect(d.reasons.join(' ')).toMatch(/wcięta w stok/);
  });

  it('10. horseshoe 10 m → stanowisko_sprzetu', () => {
    const d = only(run(scenarios.podkowa()), 'stanowisko_sprzetu');
    expect(d).toMatchObject({ priority: 'sredni', flags: { uxo: true, warGraves: false } });
    expect(d.reasons.join(' ')).toMatch(/otwarty na południe/);
  });

  it('11. parallel ridges every 8 m, 0.2 m high → pola_dawne', () => {
    const d = only(run(scenarios.pola()), 'pola_dawne');
    expect(d.priority).toBe('sredni');
    expect(d.reasons.join(' ')).toMatch(/co 8 m/);
  });

  it('12. 40 scattered windthrows → all natural, no military group', () => {
    const ds = run(scenarios.wykroty());
    expect(ds.length).toBeGreaterThanOrEqual(35);
    expect(
      ds.filter((d) => d.priority !== 'naturalne'),
      brief(ds),
    ).toHaveLength(0);
    expect(ds.some((d) => d.form === 'skupisko')).toBe(false);
  });

  it('house-sized rectangles with cellars → zaginiona_osada (beyond the 12 models)', () => {
    const t = new Terrain()
      .add(rectPit(60, 60, 10, 8, 0.8))
      .add(rectPit(90, 62, 12, 6, 0.7))
      .add(rectPit(70, 95, 9, 9, 0.8))
      .add(rectPit(100.5, 90.5, 3, 3, 0.9)) // odd sizes centred on half-metres = exactly 3 cells
      .add(rectPit(55.5, 85, 3, 2, 0.9));
    const d = only(run(t), 'zaginiona_osada');
    expect(d.priority).toBe('najwyzszy');
    expect(d.reasons.join(' ')).toMatch(/piwniczki/);
  });

  describe('calibration on real sheets (2026-10)', () => {
    it('a straight ditch with a bank on one side is not a trench (roadside ditch)', () => {
      const ds = run(
        new Terrain().add(
          trench(
            [
              [20, 100],
              [180, 100],
            ],
            1.5,
            1,
            -1,
          ),
        ),
      );
      expect(
        ds.some((d) => d.interpretation === 'okop'),
        brief(ds),
      ).toBe(false);
    });

    it('a broad low swell is not a barrow', () => {
      const ds = run(new Terrain().add(dome(100, 100, 26, 0.7)));
      expect(
        ds.some((d) => d.interpretation === 'kurhan'),
        brief(ds),
      ).toBe(false);
    });

    it('short elongated scraps are not lines', () => {
      const ds = run(
        new Terrain().add(
          trench(
            [
              [100, 100],
              [104, 100],
            ],
            1,
            0.8,
            -1,
          ),
        ),
      );
      expect(
        ds.some((d) => d.form === 'linia'),
        brief(ds),
      ).toBe(false);
    });

    it('a lone pit with spoil on one side is never firing positions', () => {
      const ds = run(
        new Terrain()
          .add((x, y) => (Math.hypot(x - 100, y - 100) < 1 ? -0.8 : 0))
          .add(dome(100, 98, 3, 0.5)),
      );
      expect(
        ds.some((d) => d.interpretation === 'stanowiska_strzeleckie'),
        brief(ds),
      ).toBe(false);
    });
  });

  it('every detection explains itself in plain Polish without long dashes', () => {
    for (const make of Object.values(scenarios))
      for (const d of run(make())) {
        expect(d.reasons.length).toBeGreaterThan(0);
        expect(d.reasons.join(' ')).not.toMatch(/[—–]/);
      }
  });
});
