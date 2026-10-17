import { describe, expect, it } from 'vitest';
import { fieldResultsByForm } from '@/features/analysis/utils/fieldResultsByForm';
import { fieldStatusByCandidate } from '@/features/analysis/utils/fieldStatusByCandidate';
import { makeCandidate } from '../../helpers/candidates';
import { makePoint } from '../../helpers/fixtures';

describe('field results back on the laptop', () => {
  const candidates = [
    makeCandidate({ id: 'c1', form: 'zaglebienie_okragle', decision: 'przyjety' }),
    makeCandidate({ id: 'c2', form: 'zaglebienie_okragle', decision: 'przyjety' }),
    makeCandidate({ id: 'c3', form: 'kopiec_okragly', decision: 'przyjety' }),
    makeCandidate({ id: 'c4', form: 'wal_liniowy', decision: 'nowy' }),
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
    expect(status.size).toBe(3);
  });

  it('counts accepted, checked and finds per class, best first', () => {
    expect(fieldResultsByForm(candidates, status)).toEqual([
      { form: 'zaglebienie_okragle', accepted: 2, checked: 2, finds: 1, empty: 1 },
      { form: 'kopiec_okragly', accepted: 1, checked: 0, finds: 0, empty: 0 },
    ]);
  });
});
