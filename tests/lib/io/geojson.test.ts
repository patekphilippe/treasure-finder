import { describe, expect, it } from 'vitest';
import { toPointsGeoJSON, toTracksGeoJSON } from '@/shared/lib/io';
import { makePoint, makeTrack } from '../../helpers/fixtures';

describe('toPointsGeoJSON', () => {
  it('writes coordinates as [lng, lat] (EPSG:4326 order QGIS expects)', () => {
    const fc = toPointsGeoJSON([makePoint({ lat: 52.25, lng: 21.01 })]);
    expect(fc.features[0]?.geometry.coordinates).toEqual([21.01, 52.25]);
  });

  it('keeps the model fields as properties without lat/lng', () => {
    const props = toPointsGeoJSON([makePoint({ name: 'Lej', depthCm: 20 })]).features[0]
      ?.properties;
    expect(props).toMatchObject({ name: 'Lej', depthCm: 20, status: 'do_sprawdzenia' });
    expect(props).not.toHaveProperty('lat');
  });
});

describe('toTracksGeoJSON', () => {
  it('builds a MultiLineString with a line per segment', () => {
    const track = makeTrack({
      segments: [
        [
          [52, 19, 0, 5],
          [52.001, 19.001, 1, 5],
        ],
        [
          [52.01, 19.01, 2, 5],
          [52.011, 19.011, 3, 5],
        ],
      ],
    });
    const f = toTracksGeoJSON([track]).features[0];
    expect(f?.geometry.coordinates).toEqual([
      [
        [19, 52],
        [19.001, 52.001],
      ],
      [
        [19.01, 52.01],
        [19.011, 52.011],
      ],
    ]);
    expect(f?.properties).not.toHaveProperty('segments');
  });

  it('skips single-vertex segments and empty tracks', () => {
    const fc = toTracksGeoJSON([
      makeTrack({ id: 'a', segments: [[[52, 19, 0, 5]]] }),
      makeTrack({ id: 'b', segments: [[]] }),
    ]);
    expect(fc.features).toHaveLength(0);
  });
});
