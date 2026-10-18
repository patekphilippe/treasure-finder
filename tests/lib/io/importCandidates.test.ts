import { describe, expect, it } from 'vitest';
import {
  importCandidatesGeoJSON,
  isCandidatesGeoJSON,
  mergeCandidates,
  RECOMPUTE_REASON,
} from '@/shared/lib/io';
import { candidatesGeoJSON, makeCandidate } from '../../helpers/candidates';

describe('importCandidatesGeoJSON', () => {
  it('round-trips the interpretation model', () => {
    const c = makeCandidate({
      searchZone: {
        type: 'Polygon',
        coordinates: [
          [
            [16, 51],
            [16.001, 51],
            [16.001, 51.001],
            [16, 51],
          ],
        ],
      },
    });
    const { candidates, skipped } = importCandidatesGeoJSON(candidatesGeoJSON([c]));
    expect(candidates).toEqual([c]);
    expect(skipped).toBe(0);
  });

  it('keeps old QGIS candidates but marks them for recomputation', () => {
    const old = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [16.38, 51.2] },
          properties: {
            id: 'old-1',
            form: 'kopiec_okragly',
            score: 72,
            protectedLikely: true,
            decision: 'odrzucony',
          },
        },
      ],
    };
    const [c] = importCandidatesGeoJSON(old).candidates;
    expect(c).toMatchObject({
      interpretation: 'nieokreslona',
      priority: 'chroniony',
      decision: 'odrzucony',
      needsRecompute: true,
      reasons: [RECOMPUTE_REASON],
    });
  });

  it('skips invalid features and clamps values', () => {
    const json = candidatesGeoJSON([
      makeCandidate({ id: 'ok', score: 140, confidence: 3 }),
      makeCandidate({ id: 'y', lat: 500 }),
      makeCandidate({ id: '' }),
    ]);
    const r = importCandidatesGeoJSON(json);
    expect(r.candidates.map((c) => [c.id, c.score, c.confidence])).toEqual([['ok', 100, 1]]);
    expect(r.skipped).toBe(2);
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
  it('updates analysis results but keeps decisions and notes made here', () => {
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
