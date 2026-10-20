import { describe, expect, it } from 'vitest';
import { HISTORICAL_LAYERS } from '@/features/layers/config/historicalLayers';
import { contextLine } from '@/features/history/utils/contextLine';
import { idsSeenOn } from '@/features/history/utils/idsSeenOn';
import { knownMaps } from '@/features/history/utils/knownMaps';
import type { ContextFeature, MapRef } from '@/shared/types/domain';

const OLDER: MapRef = {
  kind: 'wms',
  id: 'UMWD_Messtischblat_starsze',
  label: 'Messtischblatt Dolny Śląsk, starsze wydania (1883–1942)',
};
const ORTHO_2004: MapRef = {
  kind: 'wms',
  id: 'orto-archiwalna',
  label: 'Ortofotomapa archiwalna 2004',
  time: 2004,
};
const point = (id: string, p: Partial<ContextFeature>): ContextFeature => ({
  id,
  kind: 'mlyn',
  geometry: { type: 'Point', coordinates: [16, 51] },
  source: 'zaznaczone ręcznie',
  ...p,
});

describe('objects seen on the visible map', () => {
  const known = knownMaps(HISTORICAL_LAYERS, []);
  const features = [
    point('new', { seen: [{ map: OLDER, how: 'ai' }] }),
    point('old', {
      source: 'auto (AI): Messtischblatt Dolny Śląsk, starsze wydania (1883–1942), młyn',
    }),
    point('ortho', { seen: [{ map: ORTHO_2004, how: 'reczne' }] }),
    point('hand', {}),
  ];

  it('new and older objects of that map; the orthophoto only with the same year', () => {
    expect(idsSeenOn(features, OLDER, known)).toEqual(new Set(['new', 'old']));
    expect(idsSeenOn(features, ORTHO_2004, known)).toEqual(new Set(['ortho']));
    expect(idsSeenOn(features, { ...ORTHO_2004, time: 2009 }, known).size).toBe(0);
  });
});

describe('an object in the list', () => {
  it('what the map says, the years and how many maps; an older object its description', () => {
    expect(
      contextLine(
        point('a', {
          label: 'Młyn: Mühle',
          seen: [
            { map: OLDER, years: { from: 1883, to: 1942 }, how: 'ai' },
            { map: ORTHO_2004, years: { from: 2004, to: 2004 }, how: 'reczne' },
          ],
        }),
      ),
    ).toBe('Młyn: Mühle · 1883–2004 · 2 mapy');
    expect(contextLine(point('b', { label: 'Młyn', seen: [{ map: OLDER, how: 'ai' }] }))).toBe(
      'Młyn',
    );
    expect(contextLine(point('c', {}))).toBe('zaznaczone ręcznie');
    const byHand = point('d', {
      seen: [
        { map: OLDER, years: { from: 1883, to: 1942 }, how: 'reczne' },
        { map: ORTHO_2004, years: { from: 2004, to: 2004 }, how: 'reczne' },
      ],
    });
    expect(contextLine({ ...byHand, seen: byHand.seen!.slice(0, 1) })).toBe(OLDER.label);
    expect(contextLine(byHand)).toBe('2 mapy · 1883–2004');
  });
});
