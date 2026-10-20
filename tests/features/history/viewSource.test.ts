import { describe, expect, it } from 'vitest';
import { HISTORICAL_LAYERS, ORTHO_ARCHIVE_ID } from '@/features/layers/config/historicalLayers';
import { parseMapYear } from '@/features/history/utils/parseMapYear';
import { toViewSource } from '@/features/history/utils/toViewSource';
import type { OwnMap } from '@/shared/types/domain';

const own: OwnMap = {
  id: 'm1',
  name: 'Wehrmacht Hirschberg',
  created: 0,
  image: new Blob(),
  width: 10,
  height: 10,
  pixelToSource: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  epsg: 2180,
  method: 'corners',
  visible: true,
  opacity: 0.8,
};
const older = HISTORICAL_LAYERS.find((l) => l.id === 'UMWD_Messtischblat_starsze')!;
const ortho = HISTORICAL_LAYERS.find((l) => l.id === ORTHO_ARCHIVE_ID)!;

describe('a historical map as a source', () => {
  it('an own map, with its year when known', () => {
    expect(toViewSource({ own })).toMatchObject({
      kind: 'own',
      label: 'Wehrmacht Hirschberg (własna mapa)',
      ref: { kind: 'own', id: 'm1', label: 'Wehrmacht Hirschberg (własna mapa)' },
    });
    expect(toViewSource({ own })).not.toHaveProperty('years');
    expect(toViewSource({ own: { ...own, year: 1944 } })).toMatchObject({
      label: 'Wehrmacht Hirschberg (własna mapa, 1944)',
      years: { from: 1944, to: 1944 },
    });
  });

  it('a Messtischblatt layer with the years of its maps', () => {
    expect(toViewSource({ layer: older, year: 2004 })).toMatchObject({
      kind: 'wms',
      label: 'Messtischblatt Dolny Śląsk, starsze wydania (1883–1942)',
      ref: { kind: 'wms', id: older.id },
      years: { from: 1883, to: 1942 },
    });
    expect(toViewSource({ layer: older, year: 2004 }).ref).not.toHaveProperty('time');
  });

  it('the archival orthophoto with the year chosen', () => {
    expect(toViewSource({ layer: ortho, year: 2004 })).toMatchObject({
      label: 'Ortofotomapa archiwalna 2004',
      ref: { kind: 'wms', id: ORTHO_ARCHIVE_ID, time: 2004 },
      years: { from: 2004, to: 2004 },
    });
  });
});

describe('the year typed for a map', () => {
  it('reads a year, clears on empty, rejects the rest', () => {
    expect(parseMapYear(' 1936 ')).toBe(1936);
    expect(parseMapYear('')).toBeUndefined();
    expect(parseMapYear('36')).toBeNull();
    expect(parseMapYear('1936r')).toBeNull();
    expect(parseMapYear('1200')).toBeNull();
    expect(parseMapYear('2300')).toBeNull();
  });
});
