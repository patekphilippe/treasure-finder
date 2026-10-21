import { describe, expect, it } from 'vitest';
import { timeRange } from '@/features/history/utils/timeRange';
import { timeSelection } from '@/features/history/utils/timeSelection';
import { HISTORICAL_LAYERS } from '@/features/layers/config/historicalLayers';
import { makeOwnMap } from '../../helpers/fixtures';

const maps = [
  makeOwnMap({ id: 'p', name: '301 Poznań', year: 1921 }),
  makeOwnMap({ id: 'w', name: 'WIG', year: 1936 }),
];

describe('the time slider', () => {
  it('spans every historical map, own and online, even with no own map', () => {
    expect(timeRange([], HISTORICAL_LAYERS)).toEqual({ min: 1883, max: 2025 });
    expect(timeRange([makeOwnMap({ year: 1850 })], HISTORICAL_LAYERS)?.min).toBe(1850);
  });

  it('a year shows your maps of that year and the online map covering it', () => {
    const y1921 = timeSelection(1921, maps, HISTORICAL_LAYERS);
    expect(y1921.years).toEqual([1921]);
    // both Messtischblatt editions hold 1921: the newer one
    expect(y1921.layerId).toBe('UMWD_Messtischblat_nowsze');
    expect(y1921.shown[0]).toBe('301 Poznań (Twoja mapa)');

    const y1890 = timeSelection(1890, maps, HISTORICAL_LAYERS);
    expect(y1890).toMatchObject({
      years: [],
      layerId: 'UMWD_Messtischblat_starsze',
      layerYear: null,
    });

    // an orthophoto of that very year
    expect(timeSelection(2004, maps, HISTORICAL_LAYERS)).toMatchObject({
      years: [],
      layerId: 'orto-archiwalna',
      layerYear: 2004,
    });
    // between the editions and the photos: nothing
    expect(timeSelection(1960, maps, HISTORICAL_LAYERS)).toMatchObject({
      years: [],
      layerId: null,
      shown: [],
    });
  });
});
