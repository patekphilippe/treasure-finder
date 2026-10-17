import { describe, expect, it } from 'vitest';
import { DEFAULT_FILTERS } from '@/features/analysis/config/filters';
import { candidatePointInput } from '@/features/analysis/utils/candidatePointInput';
import { filterCandidates } from '@/features/analysis/utils/filterCandidates';
import { makeCandidate } from '../../helpers/candidates';

describe('candidatePointInput', () => {
  it('names the point like "Zagłębienie okrągłe 12 (ocena 73)" with dimensions', () => {
    const p = candidatePointInput(makeCandidate());
    expect(p).toMatchObject({
      type: 'anomalia',
      status: 'do_sprawdzenia',
      src: 'analiza',
      candidateId: 'M-33-33-B-d-3-1-0012',
      name: 'Zagłębienie okrągłe 12 (ocena 73)',
    });
    expect(p.desc).toBe('6×4,2 m, głębokość 1,1 m, pole 20 m² · arkusz M-33-33-B-d-3-1');
  });

  it('describes mounds by height and carries the note', () => {
    const p = candidatePointInput(
      makeCandidate({ form: 'kopiec_okragly', reliefM: 0.8, note: 'SVF' }),
    );
    expect(p.desc).toContain('wysokość 0,8 m');
    expect(p.desc).toMatch(/SVF$/);
  });
});

describe('filterCandidates', () => {
  const list = [
    makeCandidate({ id: 'low', score: 30 }),
    makeCandidate({ id: 'best', score: 90 }),
    makeCandidate({ id: 'prot', score: 80, protectedLikely: true, form: 'kopiec_okragly' }),
    makeCandidate({ id: 'rej', score: 85, decision: 'odrzucony' }),
  ];

  it('applies the minimum score, hides rejected and sorts best first', () => {
    expect(filterCandidates(list, DEFAULT_FILTERS).map((c) => c.id)).toEqual(['best', 'prot']);
  });

  it('filters by class and can hide protected / show rejected', () => {
    const f = { ...DEFAULT_FILTERS, minScore: 0, showProtected: false, showRejected: true };
    expect(filterCandidates(list, f).map((c) => c.id)).toEqual(['best', 'rej', 'low']);
    expect(
      filterCandidates(list, { ...DEFAULT_FILTERS, forms: ['kopiec_okragly'] }).map((c) => c.id),
    ).toEqual(['prot']);
  });
});
