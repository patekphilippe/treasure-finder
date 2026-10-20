import { describe, expect, it } from 'vitest';
import { legacySightings, mergeSighting, type KnownMap } from '@/shared/lib/history';
import type { ContextFeature, MapRef, Sighting } from '@/shared/types/domain';

const OLDER: MapRef = { kind: 'wms', id: 'starsze', label: 'Messtischblatt starsze (1883–1942)' };
const NEWER: MapRef = { kind: 'wms', id: 'nowsze', label: 'Messtischblatt nowsze (1905–1944)' };
const OWN: MapRef = { kind: 'own', id: 'm1', label: 'Wehrmacht (własna mapa, 1944)' };

const known: KnownMap[] = [
  { ref: OLDER, text: 'Messtischblatt starsze', years: { from: 1883, to: 1942 } },
  { ref: NEWER, text: 'Messtischblatt nowsze', years: { from: 1905, to: 1944 } },
];
const opts = {
  mergeM: 80,
  duplicateM: 40,
  sightingsOf: (f: ContextFeature) => f.seen ?? legacySightings(f.source, known),
};

/** ~1 m of latitude in degrees */
const M = 1 / 111_195;
const on = (map: MapRef, how: Sighting['how'] = 'ai'): Sighting => ({ map, how, at: 1 });
const point = (
  id: string,
  northM: number,
  seen: Sighting[] | undefined,
  p: Partial<ContextFeature> = {},
): ContextFeature => ({
  id,
  kind: 'mlyn',
  geometry: { type: 'Point', coordinates: [16, 51 + northM * M] },
  source: 'x',
  ...(seen && { seen }),
  ...p,
});

describe('one object, many maps', () => {
  it('the same mill on another map within 80 m gets that map', () => {
    const mill = point('a', 0, [on(OLDER)], { label: 'Młyn: Mühle' });
    const r = mergeSighting(
      [mill],
      point('b', 60, [on(NEWER)], { label: 'Młyn: Wassermühle' }),
      opts,
    );
    expect(r.result).toBe('merged');
    expect(r.feature).toEqual({ ...mill, seen: [on(OLDER), on(NEWER)] });
    expect(r.result !== 'new' && Math.round(r.distM)).toBe(60);
  });

  it('too far, another kind or a line: a new object', () => {
    const mill = point('a', 0, [on(OLDER)]);
    expect(mergeSighting([mill], point('b', 90, [on(NEWER)]), opts).result).toBe('new');
    expect(
      mergeSighting([mill], point('b', 10, [on(NEWER)], { kind: 'karczma' }), opts).result,
    ).toBe('new');
    const line: ContextFeature = {
      ...point('c', 0, [on(NEWER)], { kind: 'wojsko' }),
      geometry: {
        type: 'LineString',
        coordinates: [
          [16, 51],
          [16.001, 51],
        ],
      },
    };
    expect(mergeSighting([{ ...line, id: 'd', seen: [on(OLDER)] }], line, opts).result).toBe('new');
  });

  it('the same map again: one object within 40 m, two mills further apart', () => {
    const mill = point('a', 0, [on(OLDER)]);
    const again = mergeSighting([mill], point('b', 30, [on(OLDER)]), opts);
    expect(again).toMatchObject({ result: 'duplicate', feature: mill });
    expect(mergeSighting([mill], point('b', 60, [on(OLDER)]), opts).result).toBe('new');
  });

  it('a comparison seen on both maps adds only the map that is new', () => {
    const mill = point('a', 0, [on(OLDER)]);
    const r = mergeSighting([mill], point('b', 20, [on(OLDER), on(NEWER)]), opts);
    expect(r.result).toBe('merged');
    expect(r.feature.seen).toEqual([on(OLDER), on(NEWER)]);
  });

  it('broad kinds need the same name', () => {
    const lodge = point('a', 0, [on(OLDER)], { kind: 'inne', label: 'Leśniczówka: Försterei' });
    const brickworks = point('b', 10, [on(NEWER)], { kind: 'inne', label: 'Cegielnia' });
    expect(mergeSighting([lodge], brickworks, opts).result).toBe('new');
    const lodge2 = { ...brickworks, label: 'Leśniczówka (dziś bez zabudowy)' };
    expect(mergeSighting([lodge], lodge2, opts).result).toBe('merged');
    const unnamed = { ...brickworks, label: undefined };
    expect(mergeSighting([{ ...lodge, label: undefined }], unnamed, opts).result).toBe('new');
  });

  it('an older object gets its maps from its description, then the new one', () => {
    const old = point('a', 0, undefined, {
      source: 'auto (AI): Messtischblatt starsze (1883–1942), młyn: mühle',
    });
    const r = mergeSighting([old], point('b', 20, [on(OWN)]), opts);
    expect(r.feature.seen).toEqual([
      { map: OLDER, how: 'ai', years: { from: 1883, to: 1942 } },
      on(OWN),
    ]);
    expect(r.feature.source).toBe(old.source);
  });

  it('objects of other community members are never changed', () => {
    const community = {
      id: 'k',
      author: 'Jan',
      mineAuthor: false,
      up: 0,
      down: 0,
      mine: 0 as const,
    };
    const theirs = point('wspolna-k', 0, [on(OLDER)], { community });
    expect(mergeSighting([theirs], point('b', 10, [on(NEWER)]), opts).result).toBe('new');
    const mine = { ...theirs, community: { ...community, mineAuthor: true } };
    expect(mergeSighting([mine], point('b', 10, [on(NEWER)]), opts).result).toBe('merged');
  });

  it('marked by hand for the first time: the object moves there, its label stays', () => {
    const mill = point('a', 0, [on(OLDER)], { label: 'Młyn: Mühle' });
    const byHand = point('b', 50, [on(OWN, 'reczne')], { label: 'Młyn' });
    const r = mergeSighting([mill], byHand, opts);
    expect(r.feature.geometry).toEqual(byHand.geometry);
    expect(r.feature.label).toBe('Młyn: Mühle');
    expect(r.feature.id).toBe('a');
    const again = mergeSighting([r.feature], point('c', 0, [on(NEWER, 'reczne')]), opts);
    expect(again.feature.geometry).toEqual(byHand.geometry);
  });

  it('the nearest matching object takes the map', () => {
    const far = point('far', 70, [on(OLDER)]);
    const near = point('near', 15, [on(OLDER)]);
    expect(mergeSighting([far, near], point('b', 0, [on(NEWER)]), opts).feature.id).toBe('near');
  });
});
