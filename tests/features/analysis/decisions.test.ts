import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  acceptCandidate,
  ProtectedCandidateError,
  rejectCandidate,
  setCandidateNote,
} from '@/features/analysis/services/candidateDecisions';
import { useAnalysisStore } from '@/features/analysis/store/useAnalysisStore';
import { usePointsStore } from '@/features/points';
import { candidatesRepo, pointsRepo } from '@/shared/db';
import { makeCandidate } from '../../helpers/candidates';
import { clearDb } from '../../helpers/clearDb';

async function seed(...list: ReturnType<typeof makeCandidate>[]) {
  await candidatesRepo.putMany(list);
  await useAnalysisStore.getState().load();
  await usePointsStore.getState().load();
}

describe('candidate decisions', () => {
  beforeEach(clearDb);

  it('accepting creates one point to check, only once', async () => {
    const c = makeCandidate();
    await seed(c);
    const p1 = await acceptCandidate(c, 1000);
    const p2 = await acceptCandidate(c, 2000);
    expect(p2.id).toBe(p1.id);
    expect(await pointsRepo.getAll()).toHaveLength(1);
    expect(p1).toMatchObject({
      type: 'anomalia',
      status: 'do_sprawdzenia',
      src: 'analiza',
      candidateId: c.id,
    });
    expect((await candidatesRepo.getAll())[0]?.decision).toBe('przyjety');
  });

  it('a probably protected candidate can never be accepted', async () => {
    const c = makeCandidate({ protectedLikely: true });
    await seed(c);
    await expect(acceptCandidate(c)).rejects.toBeInstanceOf(ProtectedCandidateError);
    expect(await pointsRepo.getAll()).toHaveLength(0);
  });

  it('rejecting and notes are persisted', async () => {
    const c = makeCandidate();
    await seed(c);
    await rejectCandidate(c);
    await setCandidateNote(c, 'stos kamieni');
    expect((await candidatesRepo.getAll())[0]).toMatchObject({
      decision: 'odrzucony',
      note: 'stos kamieni',
    });
  });
});
