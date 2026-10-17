import { describe, expect, it } from 'vitest';
import { importCandidatesGeoJSON, isCandidatesGeoJSON, mergeCandidates } from '@/shared/lib/io';
import { candidatesGeoJSON, makeCandidate } from '../../helpers/candidates';

describe('importCandidatesGeoJSON', () => {
  it('reads kandydaci.geojson from qgis/detect.py', () => {
    const c = makeCandidate();
    const { candidates, skipped } = importCandidatesGeoJSON(candidatesGeoJSON([c]));
    expect(candidates).toEqual([c]);
    expect(skipped).toBe(0);
  });

  it('skips features with an unknown form, bad coordinates or no id', () => {
    const json = candidatesGeoJSON([
      makeCandidate({ id: 'ok' }),
      makeCandidate({ id: 'x', form: 'ufo' as never }),
      makeCandidate({ id: 'y', lat: 500 }),
      makeCandidate({ id: '' }),
    ]);
    const r = importCandidatesGeoJSON(json);
    expect(r.candidates.map((c) => c.id)).toEqual(['ok']);
    expect(r.skipped).toBe(3);
  });

  it('clamps the score to 0–100 and defaults the decision', () => {
    const json = candidatesGeoJSON([makeCandidate({ score: 140, decision: 'xx' as never })]);
    expect(importCandidatesGeoJSON(json).candidates[0]).toMatchObject({
      score: 100,
      decision: 'nowy',
    });
  });

  it('tells candidate files apart from QGIS point layers', () => {
    expect(isCandidatesGeoJSON(candidatesGeoJSON([makeCandidate()]))).toBe(true);
    const points = {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: { nazwa: 'A' } }],
    };
    expect(isCandidatesGeoJSON(points)).toBe(false);
  });
});

describe('mergeCandidates', () => {
  it('updates measurements but keeps decisions and notes made here', () => {
    const local = [makeCandidate({ id: 'a', decision: 'odrzucony', note: 'gnojownik', score: 70 })];
    const incoming = [makeCandidate({ id: 'a', score: 55 }), makeCandidate({ id: 'b' })];
    const r = mergeCandidates(local, incoming);
    expect(r).toMatchObject({ added: 1, updated: 1 });
    expect(r.toWrite[0]).toMatchObject({
      id: 'a',
      score: 55,
      decision: 'odrzucony',
      note: 'gnojownik',
    });
  });
});
