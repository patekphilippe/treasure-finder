import type { MultiPolygon, Polygon } from 'geojson';
import { describe, expect, it } from 'vitest';
import { pointInPolygon } from '@/shared/lib/geo';

const squareWithHole: Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [19, 52],
      [20, 52],
      [20, 53],
      [19, 53],
      [19, 52],
    ],
    [
      [19.4, 52.4],
      [19.6, 52.4],
      [19.6, 52.6],
      [19.4, 52.6],
      [19.4, 52.4],
    ],
  ],
};

describe('pointInPolygon', () => {
  it('detects a point inside', () => {
    expect(pointInPolygon(52.2, 19.2, squareWithHole)).toBe(true);
  });

  it('detects a point outside', () => {
    expect(pointInPolygon(54, 19.5, squareWithHole)).toBe(false);
  });

  it('treats holes as outside', () => {
    expect(pointInPolygon(52.5, 19.5, squareWithHole)).toBe(false);
  });

  it('supports MultiPolygon', () => {
    const multi: MultiPolygon = {
      type: 'MultiPolygon',
      coordinates: [
        squareWithHole.coordinates,
        [
          [
            [21, 50],
            [22, 50],
            [22, 51],
            [21, 50],
          ],
        ],
      ],
    };
    expect(pointInPolygon(50.2, 21.8, multi)).toBe(true);
  });
});
