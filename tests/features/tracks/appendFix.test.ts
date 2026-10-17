import { describe, expect, it } from 'vitest';
import { appendFix } from '@/features/tracks/utils/appendFix';
import { makeTrack } from '../../helpers/fixtures';

const fix = (lat: number, lng: number, t = 0) => ({ lat, lng, accM: 5, t });
const M = 1 / 111_195; // ~1 m of latitude

describe('appendFix', () => {
  it('adds a vertex [lat, lng, t, accM] to the last segment', () => {
    const t = appendFix(makeTrack(), fix(52, 19, 1000));
    expect(t.segments).toEqual([[[52, 19, 1000, 5]]]);
    expect(t.distM).toBe(0);
  });

  it('accumulates distance within a segment', () => {
    let t = appendFix(makeTrack(), fix(52, 19));
    t = appendFix(t, fix(52 + 10 * M, 19));
    t = appendFix(t, fix(52 + 30 * M, 19));
    expect(t.distM).toBeCloseTo(30, 1);
  });

  it('does not count the gap between segments', () => {
    let t = appendFix(makeTrack(), fix(52, 19));
    t = { ...t, segments: [...t.segments, []] };
    t = appendFix(t, fix(52 + 500 * M, 19));
    expect(t.distM).toBe(0);
    expect(t.segments).toHaveLength(2);
  });

  it('does not mutate the input track', () => {
    const original = makeTrack();
    appendFix(original, fix(52, 19));
    expect(original.segments).toEqual([[]]);
  });
});
