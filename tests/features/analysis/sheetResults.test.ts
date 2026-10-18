import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  acceptCandidate,
  ProtectedCandidateError,
} from '@/features/analysis/services/candidateDecisions';
import { saveSheetResults } from '@/features/analysis/services/saveSheetResults';
import { useAnalysisStore } from '@/features/analysis/store/useAnalysisStore';
import { mergeSheetCandidates } from '@/features/analysis/utils/mergeSheetCandidates';
import { sheetIdFromName } from '@/features/analysis/utils/sheetIdFromName';
import { usePointsStore } from '@/features/points';
import { candidatesRepo, zonesRepo } from '@/shared/db';
import { makeCandidate } from '../../helpers/candidates';
import { clearDb } from '../../helpers/clearDb';

const zone = (lng: number, lat: number, d = 0.0002) => ({
  type: 'Polygon' as const,
  coordinates: [
    [
      [lng - d, lat - d],
      [lng + d, lat - d],
      [lng + d, lat + d],
      [lng - d, lat + d],
      [lng - d, lat - d],
    ],
  ],
});

describe('sheet id', () => {
  it('reads the godło from Geoportal names', () => {
    expect(sheetIdFromName('4102_77565_M-33-33-B-d-3-1.asc')).toBe('M-33-33-B-d-3-1');
    expect(sheetIdFromName('moj_teren.tif')).toBe('moj_teren');
  });
});

describe('mergeSheetCandidates (re-running a sheet)', () => {
  it('same place keeps id, decision and note; new places get free ids; undecided gone ones are deleted', () => {
    const old = [
      makeCandidate({
        id: 'S-0001',
        sheetId: 'S',
        lat: 51.2,
        lng: 16.38,
        decision: 'przyjety',
        note: 'byłem',
      }),
      makeCandidate({ id: 'S-0002', sheetId: 'S', lat: 51.21, lng: 16.39, decision: 'nowy' }),
      makeCandidate({ id: 'S-0003', sheetId: 'S', lat: 51.22, lng: 16.4, decision: 'odrzucony' }),
    ];
    const fresh = [
      makeCandidate({
        id: 'S-0001',
        sheetId: 'S',
        lat: 51.20002,
        lng: 16.38,
        interpretation: 'okop',
      }),
      makeCandidate({ id: 'S-0002', sheetId: 'S', lat: 51.3, lng: 16.5 }),
    ];
    const r = mergeSheetCandidates(old, fresh);
    expect(r.toWrite[0]).toMatchObject({
      id: 'S-0001',
      interpretation: 'okop',
      decision: 'przyjety',
      note: 'byłem',
    });
    expect(r.toWrite[1]!.id).toBe('S-0004'); // 0002 and 0003 still exist
    expect(r.toDelete).toEqual(['S-0002']);
  });

  it('a place accepted earlier that is now protected goes back to nowy', () => {
    const old = [makeCandidate({ id: 'S-0001', sheetId: 'S', decision: 'przyjety', note: 'x' })];
    const fresh = [makeCandidate({ id: 'S-0001', sheetId: 'S', priority: 'chroniony' })];
    expect(mergeSheetCandidates(old, fresh).toWrite[0]).toMatchObject({
      decision: 'nowy',
      note: 'x',
    });
  });
});

describe('saving results and accepting', () => {
  beforeEach(async () => {
    await clearDb();
    await usePointsStore.getState().load();
  });

  it('protected exclusion zones become forbidden zones, replaced on re-run', async () => {
    const barrow = makeCandidate({
      id: 'S-0001',
      sheetId: 'S',
      priority: 'chroniony',
      interpretation: 'kurhan',
      exclusionZone: zone(16.38, 51.2),
    });
    await saveSheetResults('S', [barrow]);
    await saveSheetResults('S', [barrow]);
    const zones = await zonesRepo.getAll();
    expect(zones).toHaveLength(1);
    expect(zones[0]).toMatchObject({
      kind: 'zakaz',
      name: 'Prawdopodobne stanowisko: Kurhan (S-0001)',
    });
    await expect(
      acceptCandidate(useAnalysisStore.getState().candidates[0]!),
    ).rejects.toBeInstanceOf(ProtectedCandidateError);
  });

  it('accepting puts the point in the middle of the search zone', async () => {
    const c = makeCandidate({
      id: 'S-0001',
      sheetId: 'S',
      lat: 51.2,
      lng: 16.38,
      searchZone: zone(16.381, 51.201),
    });
    await candidatesRepo.put(c);
    await useAnalysisStore.getState().load();
    const p = await acceptCandidate(c);
    expect(p.lat).toBeCloseTo(51.201, 6);
    expect(p.lng).toBeCloseTo(16.381, 6);
  });
});
