import { describe, expect, it } from 'vitest';
import { buildExportZip, importZip, parseBackup } from '@/shared/lib/io';
import type { ContextFeature } from '@/shared/types/domain';

const mill: ContextFeature = {
  id: 'c1',
  kind: 'mlyn',
  geometry: { type: 'Point', coordinates: [15.7, 50.9] },
  source: 'auto (AI): Messtischblatt Dolny Śląsk, starsze wydania (1883–1942), młyn: mühle',
  label: 'Młyn: Mühle',
  seen: [
    {
      map: {
        kind: 'wms',
        id: 'UMWD_Messtischblat_starsze',
        label: 'Messtischblatt Dolny Śląsk, starsze wydania (1883–1942)',
      },
      years: { from: 1883, to: 1942 },
      at: 1_790_000_000_000,
      how: 'ai',
    },
    {
      map: {
        kind: 'wms',
        id: 'orto-archiwalna',
        label: 'Ortofotomapa archiwalna 2004',
        time: 2004,
      },
      years: { from: 2004, to: 2004 },
      how: 'reczne',
      confidence: 0.8,
    },
  ],
};

describe('archival objects in a backup', () => {
  it('version 2 objects stay as they are', () => {
    const old = {
      id: 'c2',
      kind: 'karczma',
      geometry: mill.geometry,
      source: 'zaznaczone ręcznie',
    };
    const r = parseBackup({ wersja: 2, points: [], context: [old, { kind: 'osada' }] });
    expect(r.context).toEqual([old]);
  });

  it('version 3 keeps the maps an object was seen on', () => {
    expect(parseBackup({ wersja: 3, points: [], context: [mill] }).context).toEqual([mill]);
  });

  it('drops broken sightings and labels, keeps the object', () => {
    const r = parseBackup({
      wersja: 3,
      points: [],
      context: [
        {
          ...mill,
          label: 7,
          seen: [
            'x',
            { map: { kind: 'wms', label: 'bez id' }, how: 'ai' },
            { map: { kind: 'own', id: 'm1', label: 'Mapa (własna mapa)' }, how: 'zgadywanie' },
            {
              map: { kind: 'own', id: 'm1', label: 'Mapa (własna mapa)' },
              how: 'reczne',
              years: { from: 1940, to: 1930 },
              confidence: 3,
            },
          ],
        },
        { ...mill, id: 'c3', seen: 'nie lista' },
      ],
    });
    expect(r.context[0]).toEqual({
      ...mill,
      label: undefined,
      seen: [{ map: { kind: 'own', id: 'm1', label: 'Mapa (własna mapa)' }, how: 'reczne' }],
    });
    expect(r.context[0]).not.toHaveProperty('label');
    expect(r.context[1]).not.toHaveProperty('seen');
  });

  it('a ZIP export reads back with its sightings', async () => {
    const zip = await buildExportZip(
      { points: [], tracks: [], candidates: [], zones: [], context: [mill] },
      new Map(),
      Date.UTC(2026, 9, 20),
    );
    const bytes = await zip.generateAsync({ type: 'arraybuffer' });
    const back = await importZip(bytes);
    expect(back.version).toBe(3);
    expect(back.context).toEqual([mill]);
  });
});
