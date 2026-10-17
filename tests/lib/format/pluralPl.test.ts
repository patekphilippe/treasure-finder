import { describe, expect, it } from 'vitest';
import { pluralPl } from '@/shared/lib/format';

const p = (n: number) => pluralPl(n, 'punkt', 'punkty', 'punktów');

describe('pluralPl', () => {
  it.each([
    [0, '0 punktów'],
    [1, '1 punkt'],
    [2, '2 punkty'],
    [4, '4 punkty'],
    [5, '5 punktów'],
    [12, '12 punktów'],
    [14, '14 punktów'],
    [22, '22 punkty'],
    [101, '101 punktów'],
    [112, '112 punktów'],
    [124, '124 punkty'],
  ])('%d → %s', (n, expected) => {
    expect(p(n)).toBe(expected);
  });
});
