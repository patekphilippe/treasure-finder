import { describe, expect, it } from 'vitest';
import { timeSelection } from '@/features/history/utils/timeSelection';
import { yearStops } from '@/features/history/utils/yearStops';
import { HISTORICAL_LAYERS } from '@/features/layers/config/historicalLayers';
import { makeOwnMap } from '../../helpers/fixtures';

const maps = [
  makeOwnMap({ id: 'p', name: '301 Poznań', year: 1921 }),
  makeOwnMap({ id: 'w', name: 'WIG', year: 1936 }),
];

describe('the time slider', () => {
  it('stops only at years with a map, own or online, even with no own map', () => {
    const online = yearStops([], HISTORICAL_LAYERS);
    // the two Messtischblatt editions, then every orthophoto year
    expect(online.stops.slice(0, 3)).toEqual([1883, 1905, 1995]);
    expect(online.stops.at(-1)).toBe(2025);
    expect(online.labelled).toEqual([1883, 2025]);
    expect(yearStops([makeOwnMap({ year: 1850 })], HISTORICAL_LAYERS).stops[0]).toBe(1850);
  });

  it('labels your years first; labels never crowd each other', () => {
    const { stops, labelled } = yearStops(
      [...maps, makeOwnMap({ id: 'x', year: 1925 }), makeOwnMap({ id: 'y', year: 1890 })],
      HISTORICAL_LAYERS,
    );
    expect(stops).toEqual(expect.arrayContaining([1890, 1921, 1925, 1936]));
    // 1925 is too close to 1921, 1883 (an end) too close to 1890
    expect(labelled).toEqual([1890, 1921, 1936, 2025]);
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
