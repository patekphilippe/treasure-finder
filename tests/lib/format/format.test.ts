import { describe, expect, it } from 'vitest';
import { formatDistance, formatDuration } from '@/shared/lib/format';

describe('formatDistance', () => {
  it.each([
    [0, '0 m'],
    [849.6, '850 m'],
    [1240, '1,24 km'],
    [12_500, '12,5 km'],
  ])('%d m → %s', (m, expected) => {
    expect(formatDistance(m).replace(/\s/g, ' ')).toBe(expected);
  });
});

describe('formatDuration', () => {
  it.each([
    [45_000, '45 s'],
    [12 * 60_000, '12 min'],
    [65 * 60_000, '1 h 05 min'],
    [-5, '0 s'],
  ])('%d ms → %s', (ms, expected) => {
    expect(formatDuration(ms)).toBe(expected);
  });
});
