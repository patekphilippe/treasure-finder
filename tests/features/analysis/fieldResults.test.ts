import { describe, expect, it } from 'vitest';
import { fieldResultsByForm } from '@/features/analysis/utils/fieldResultsByForm';
import { fieldStatusByCandidate } from '@/features/analysis/utils/fieldStatusByCandidate';
import { makeCandidate } from '../../helpers/candidates';
import { makePoint } from '../../helpers/fixtures';

describe('field results back on the laptop', () => {
  const candidates = [
    makeCandidate({ id: 'c1', interpretation: 'ziemianka', decision: 'przyjety' }),
    makeCandidate({ id: 'c2', interpretation: 'ziemianka', decision: 'przyjety' }),
    makeCandidate({ id: 'c3', interpretation: 'okop', decision: 'przyjety' }),
    makeCandidate({ id: 'c4', interpretation: 'leje', decision: 'nowy' }),
  ];
  const points = [
    makePoint({ id: 'p1', candidateId: 'c1', status: 'znalezisko' }),
    makePoint({ id: 'p2', candidateId: 'c2', status: 'pusto' }),
    makePoint({ id: 'p3', candidateId: 'c3', status: 'do_sprawdzenia' }),
    makePoint({ id: 'p4', status: 'znalezisko' }),
  ];
  const status = fieldStatusByCandidate(points);

  it('maps candidates to the status of their point', () => {
    expect(status.get('c1')).toBe('znalezisko');
    expect(status.has('c4')).toBe(false);
  });

  it('counts accepted, checked and finds per interpretation, best first', () => {
    expect(fieldResultsByForm(candidates, status)).toEqual([
      { interpretation: 'ziemianka', accepted: 2, checked: 2, finds: 1, empty: 1 },
      { interpretation: 'okop', accepted: 1, checked: 0, finds: 0, empty: 0 },
    ]);
  });
});
