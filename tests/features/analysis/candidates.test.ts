import { describe, expect, it } from 'vitest';
import { DEFAULT_FILTERS } from '@/features/analysis/config/filters';
import { candidatePointInput } from '@/features/analysis/utils/candidatePointInput';
import { filterCandidates } from '@/features/analysis/utils/filterCandidates';
import { makeCandidate } from '../../helpers/candidates';

describe('candidatePointInput', () => {
  it('names the point by interpretation and carries the reasons', () => {
    const p = candidatePointInput(
      makeCandidate({ interpretation: 'okop', reasons: ['zygzak co 10 m'] }),
    );
    expect(p).toMatchObject({
      type: 'anomalia',
      status: 'do_sprawdzenia',
      src: 'analiza',
      candidateId: 'M-33-33-B-d-3-1-0012',
      name: 'Okop 12 (ocena 73)',
    });
    expect(p.desc).toBe('6×4,2 m, głębokość 1,1 m. zygzak co 10 m. arkusz M-33-33-B-d-3-1');
  });
});

describe('filterCandidates', () => {
  const list = [
    makeCandidate({ id: 'low', score: 30, priority: 'niski' }),
    makeCandidate({ id: 'top', score: 60, priority: 'najwyzszy', interpretation: 'oboz' }),
    makeCandidate({ id: 'prot', score: 80, priority: 'chroniony', interpretation: 'kurhan' }),
    makeCandidate({ id: 'nat', score: 85, priority: 'naturalne', interpretation: 'wykrot' }),
    makeCandidate({ id: 'rej', score: 85, decision: 'odrzucony' }),
  ];

  const all = { ...DEFAULT_FILTERS, onlyBest: false };

  it('sorts by priority, then score; hides natural and rejected by default', () => {
    expect(filterCandidates(list, all).map((c) => c.id)).toEqual(['top', 'low', 'prot']);
  });

  it('filters by priority and interpretation, can show natural', () => {
    expect(
      filterCandidates(list, { ...DEFAULT_FILTERS, priorities: ['najwyzszy'] }).map((c) => c.id),
    ).toEqual(['top']);
    expect(
      filterCandidates(list, {
        ...DEFAULT_FILTERS,
        showNatural: true,
        interpretations: ['wykrot'],
      }).map((c) => c.id),
    ).toEqual(['nat']);
  });

  it('only the best by default: a low priority and a weak score go, chosen by hand they stay', () => {
    const more = [
      ...list,
      makeCandidate({ id: 'okop-weak', score: 20, priority: 'wysoki', interpretation: 'okop' }),
      makeCandidate({ id: 'okop', score: 40, priority: 'wysoki', interpretation: 'okop' }),
      makeCandidate({ id: 'kept', score: 10, priority: 'niski', decision: 'przyjety' }),
    ];
    expect(filterCandidates(more, DEFAULT_FILTERS).map((c) => c.id)).toEqual([
      'top',
      'okop',
      'kept',
      'prot',
    ]);
    expect(
      filterCandidates(more, { ...DEFAULT_FILTERS, priorities: ['niski'] }).map((c) => c.id),
    ).toEqual(['low', 'kept']);
  });
});
