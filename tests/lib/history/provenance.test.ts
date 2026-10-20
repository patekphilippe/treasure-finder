import { describe, expect, it } from 'vitest';
import {
  contextYears,
  formatYears,
  legacySightings,
  sameMap,
  yearsFromText,
  type KnownMap,
} from '@/shared/lib/history';
import type { MapRef } from '@/shared/types/domain';

const OLDER: MapRef = {
  kind: 'wms',
  id: 'UMWD_Messtischblat_starsze',
  label: 'Messtischblatt Dolny Śląsk, starsze wydania (1883–1942)',
};
const NEWER: MapRef = {
  kind: 'wms',
  id: 'UMWD_Messtischblat_nowsze',
  label: 'Messtischblatt Dolny Śląsk, nowsze wydania (1905–1944)',
};
const ORTHO: MapRef = { kind: 'wms', id: 'orto-archiwalna', label: 'Ortofotomapa archiwalna' };
const MAPA: MapRef = { kind: 'own', id: 'm1', label: 'Mapa (własna mapa)' };
const STARA: MapRef = { kind: 'own', id: 'm2', label: 'Stara Mapa (własna mapa, 1936)' };

const known: KnownMap[] = [
  { ref: OLDER, text: 'Messtischblatt Dolny Śląsk, starsze wydania', years: { from: 1883, to: 1942 } },
  { ref: NEWER, text: 'Messtischblatt Dolny Śląsk, nowsze wydania', years: { from: 1905, to: 1944 } },
  { ref: ORTHO, text: 'Ortofotomapa archiwalna', timed: true },
  { ref: MAPA, text: 'Mapa (własna mapa' },
  { ref: STARA, text: 'Stara Mapa (własna mapa', years: { from: 1936, to: 1936 } },
];

describe('years of a map', () => {
  it('formats a range and a single year', () => {
    expect(formatYears({ from: 1883, to: 1942 })).toBe('1883–1942');
    expect(formatYears({ from: 1936, to: 1936 })).toBe('1936');
  });

  it('reads years from older descriptions', () => {
    expect(yearsFromText('Messtischblatt Dolny Śląsk, starsze wydania (1883–1942)')).toEqual({
      from: 1883,
      to: 1942,
    });
    expect(yearsFromText('Kronika parafii 1936-1938')).toEqual({ from: 1936, to: 1938 });
    expect(yearsFromText('auto (AI): Ortofotomapa archiwalna 2004, młyn: mühle')).toEqual({
      from: 2004,
      to: 2004,
    });
  });

  it('finds no year in sheet numbers, files, distances or "since"', () => {
    expect(yearsFromText('MTB 4868 Hirschberg (własna mapa)')).toBeNull();
    expect(yearsFromText('mlyny_1936.geojson')).toBeNull();
    expect(yearsFromText('mapa.geojson')).toBeNull();
    expect(yearsFromText('AI ze źródła: Mühle (±150 m)')).toBeNull();
    expect(yearsFromText('Ortofotomapa archiwalna (od 1995)')).toBeNull();
    expect(yearsFromText('zaznaczone ręcznie')).toBeNull();
    expect(yearsFromText('punkt 51.1950, 15.7342')).toBeNull();
  });

  it('an object spans the years of all maps it was seen on', () => {
    expect(
      contextYears({
        source: 'x',
        seen: [
          { map: OLDER, how: 'ai', years: { from: 1883, to: 1942 } },
          { map: STARA, how: 'reczne', years: { from: 1936, to: 1936 } },
          { map: { kind: 'none', label: 'zaznaczone ręcznie' }, how: 'reczne' },
        ],
      }),
    ).toBe('1883–1942');
    expect(contextYears({ source: '1890', seen: [{ map: MAPA, how: 'ai' }] })).toBeNull();
    expect(contextYears({ source: 'auto (AI): Ortofotomapa archiwalna 2004, osada' })).toBe('2004');
    expect(contextYears({ source: 'zaznaczone ręcznie' })).toBeNull();
  });
});

describe('the same map', () => {
  it('compares layers with their year, own maps by id and descriptions by text', () => {
    expect(sameMap(OLDER, { ...OLDER, label: 'inny opis' })).toBe(true);
    expect(sameMap(OLDER, NEWER)).toBe(false);
    expect(sameMap({ ...ORTHO, time: 2004 }, { ...ORTHO, time: 2004 })).toBe(true);
    expect(sameMap({ ...ORTHO, time: 2004 }, { ...ORTHO, time: 2009 })).toBe(false);
    expect(sameMap(MAPA, { ...MAPA, label: 'zmieniona nazwa' })).toBe(true);
    expect(sameMap(MAPA, STARA)).toBe(false);
    expect(sameMap({ kind: 'none', label: 'a' }, { kind: 'none', label: 'a' })).toBe(true);
    expect(sameMap({ kind: 'none', label: 'a' }, MAPA)).toBe(false);
  });
});

describe('maps of an older object, read from its description', () => {
  it('an AI reading of an online map', () => {
    expect(
      legacySightings(
        'auto (AI): Messtischblatt Dolny Śląsk, starsze wydania (1883–1942), młyn: mühle',
        known,
      ),
    ).toEqual([{ map: OLDER, how: 'ai', years: { from: 1883, to: 1942 } }]);
  });

  it('the archival orthophoto with the year shown, and without it', () => {
    expect(legacySightings('auto (AI): Ortofotomapa archiwalna 2004, osada', known)).toEqual([
      { map: { ...ORTHO, time: 2004 }, how: 'ai', years: { from: 2004, to: 2004 } },
    ]);
    expect(legacySightings('Ortofotomapa archiwalna (od 1995)', known)).toEqual([
      { map: ORTHO, how: 'reczne' },
    ]);
  });

  it('a comparison names both maps, in the order written', () => {
    expect(
      legacySightings(
        'auto (AI, porównanie): Mapa (własna mapa) i Messtischblatt Dolny Śląsk, nowsze wydania (1905–1944), młyn: mühle (na obu mapach)',
        known,
      ),
    ).toEqual([
      { map: MAPA, how: 'ai' },
      { map: NEWER, how: 'ai', years: { from: 1905, to: 1944 } },
    ]);
  });

  it('a longer own map name wins over a shorter one inside it', () => {
    expect(legacySightings('Stara Mapa (własna mapa)', known)).toEqual([
      { map: STARA, how: 'reczne', years: { from: 1936, to: 1936 } },
    ]);
  });

  it('a community object keeps the map named in its description', () => {
    expect(
      legacySightings(
        'Społeczność: Jan · Młyn · auto (AI): Messtischblatt Dolny Śląsk, starsze wydania (1883–1942), młyn: mühle',
        known,
      ),
    ).toEqual([{ map: OLDER, how: 'ai', years: { from: 1883, to: 1942 } }]);
  });

  it('without a known map: the description itself, with the years it mentions', () => {
    expect(legacySightings('zaznaczone ręcznie', known)).toEqual([
      { map: { kind: 'none', label: 'zaznaczone ręcznie' }, how: 'reczne' },
    ]);
    expect(legacySightings('mlyny.geojson', known)).toEqual([
      { map: { kind: 'none', label: 'mlyny.geojson' }, how: 'import' },
    ]);
    expect(legacySightings('AI ze źródła: Mühle (±150 m)', known)).toEqual([
      { map: { kind: 'none', label: 'AI ze źródła: Mühle (±150 m)' }, how: 'zrodlo' },
    ]);
    expect(legacySightings('auto (AI): Messtischblatt Ostpreußen (1890–1910), młyn', known)).toEqual([
      {
        map: { kind: 'none', label: 'auto (AI): Messtischblatt Ostpreußen (1890–1910), młyn' },
        how: 'ai',
        years: { from: 1890, to: 1910 },
      },
    ]);
  });
});
