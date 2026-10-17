// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { toGpx } from '@/shared/lib/io';
import { makePoint, makeTrack } from '../../helpers/fixtures';

const parse = (xml: string) => new DOMParser().parseFromString(xml, 'application/xml');

describe('toGpx', () => {
  const gpx = toGpx(
    [makePoint({ name: 'Rów & <wał>', desc: '"cytat"', lat: 52.5, lng: 19.25 })],
    [
      makeTrack({
        name: 'Las',
        segments: [
          [
            [52, 19, 1_700_000_000_000, 5],
            [52.001, 19, 1_700_000_001_000, 5],
          ],
          [[52.002, 19, 1_700_000_002_000, 5]],
        ],
      }),
    ],
  );
  const doc = parse(gpx);

  it('is well-formed XML', () => {
    expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
    expect(doc.documentElement.getAttribute('version')).toBe('1.1');
  });

  it('writes points as waypoints with escaped text', () => {
    const wpt = doc.getElementsByTagName('wpt')[0];
    expect(wpt?.getAttribute('lat')).toBe('52.5000000');
    expect(wpt?.getAttribute('lon')).toBe('19.2500000');
    expect(wpt?.getElementsByTagName('name')[0]?.textContent).toBe('Rów & <wał>');
  });

  it('writes one trkseg per segment with ISO times', () => {
    const segs = doc.getElementsByTagName('trkseg');
    expect(segs).toHaveLength(2);
    expect(segs[0]?.getElementsByTagName('trkpt')).toHaveLength(2);
    expect(doc.getElementsByTagName('time')[1]?.textContent).toBe('2023-11-14T22:13:20.000Z');
  });
});
