import { describe, expect, it } from 'vitest';
import { mapPointMover } from '@/features/history/utils/mapPointMover';
import { movedWithMap } from '@/features/history/utils/movedWithMap';
import { fromEpsg2180, toEpsg2180 } from '@/shared/lib/geo';
import type { ContextFeature, Sighting } from '@/shared/types/domain';
import { makeOwnMap } from '../../helpers/fixtures';

const on = (id: string): Sighting => ({ map: { kind: 'own', id, label: id }, how: 'ai' });
const feature = (id: string, seen: Sighting[] | undefined, geometry: ContextFeature['geometry']) =>
  ({ id, kind: 'mlyn', geometry, source: 'test', ...(seen && { seen }) }) as ContextFeature;

describe('objects follow their map placed anew', () => {
  const shift = (lng: number, lat: number): [number, number] => [lng + 1, lat + 1];

  it('moves what was seen only on that map, points and lines alike', () => {
    const moved = movedWithMap(
      [
        feature('only', [on('m1')], { type: 'Point', coordinates: [16, 51] }),
        feature('road', [on('m1')], {
          type: 'LineString',
          coordinates: [
            [16, 51],
            [16.1, 51.1],
          ],
        }),
        feature('both', [on('m1'), on('m2')], { type: 'Point', coordinates: [16, 51] }),
        feature('other', [on('m2')], { type: 'Point', coordinates: [16, 51] }),
        feature('old', undefined, { type: 'Point', coordinates: [16, 51] }),
      ],
      'm1',
      shift,
    );
    expect(moved.map((f) => f.id)).toEqual(['only', 'road']);
    expect(moved[0]!.geometry).toEqual({ type: 'Point', coordinates: [17, 52] });
    expect(moved[1]!.geometry).toEqual({
      type: 'LineString',
      coordinates: [
        [17, 52],
        [17.1, 52.1],
      ],
    });
  });

  it('a point keeps its spot on the image: the map moved 100 m east, so does the point', () => {
    const before = makeOwnMap();
    const after = makeOwnMap({ pixelToSource: [2, 0, 300100, 0, -2, 400000, 0, 0, 1] });
    const [lat, lng] = fromEpsg2180(302000, 397000);
    const [lng2, lat2] = mapPointMover(before, after)!(lng, lat);
    const [x, y] = toEpsg2180(lat2, lng2);
    expect(x).toBeCloseTo(302100, 3);
    expect(y).toBeCloseTo(397000, 3);
  });
});
