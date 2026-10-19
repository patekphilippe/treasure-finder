import { describe, expect, it } from 'vitest';
import { fixAction } from '@/features/tracks/utils/fixAction';

const M = 1 / 111_195; // ~1 m of latitude
const NOW = 1_800_000_000_000;
const fix = (metres: number, t = NOW, accM = 5) => ({ lat: 52 + metres * M, lng: 19, accM, t });

describe('fixAction (what the recorder does with a GPS fix)', () => {
  it('skips a stale fix, e.g. the last known position when recording starts', () => {
    expect(fixAction(null, fix(0, NOW - 60_000), 0, NOW)).toBe('skip');
    expect(fixAction(null, fix(0, NOW - 5_000), 0, NOW)).toBe('append');
  });

  it('appends a walking step', () => {
    expect(fixAction(fix(0, NOW - 3000), fix(4), 0, NOW)).toBe('append');
  });

  it('skips jitter smaller than a third of the accuracy', () => {
    expect(fixAction(fix(0, NOW - 3000, 15), fix(4, NOW, 15), 0, NOW)).toBe('skip');
  });

  it('a jump far beyond both accuracy circles is a GPS jump', () => {
    expect(fixAction(fix(0, NOW - 3000), fix(80), 0, NOW)).toBe('jump');
  });

  it('after repeated jumps the new place is real: new segment', () => {
    expect(fixAction(fix(0, NOW - 3000), fix(80), 2, NOW)).toBe('newSegment');
  });

  it('a long gap (screen locked) starts a new segment instead of a straight line', () => {
    expect(fixAction(fix(0, NOW - 120_000), fix(250), 0, NOW)).toBe('newSegment');
  });
});
