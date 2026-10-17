import { describe, expect, it } from 'vitest';
import { normalizeTrack, parseBackup } from '@/shared/lib/io';
import v1 from '../../fixtures/kopia-v1.json';

describe('parseBackup — version 1', () => {
  const backup = parseBackup(v1);

  it('reads points and maps depth/acc/photo to depthCm/accM/photoId', () => {
    expect(backup.version).toBe(1);
    expect(backup.points).toHaveLength(2);
    expect(backup.points[0]).toEqual({
      id: 'v1-p1',
      type: 'znalezisko',
      status: 'do_sprawdzenia',
      name: 'Guzik mundurowy',
      desc: 'przy miedzy',
      depthCm: 15,
      lat: 52.2301,
      lng: 21.0105,
      accM: 4.2,
      src: 'gps',
      photoId: 'ph-v1-1',
      created: 1690000000000,
      updated: 1690000500000,
    });
    expect(backup.points[1]).toMatchObject({ depthCm: null, accM: null, photoId: null });
  });

  it('counts unreadable records as skipped', () => {
    expect(backup.skipped).toBe(1);
  });

  it('maps dist to distM, keeps segments and never imports as active', () => {
    expect(backup.tracks[0]).toMatchObject({ id: 'v1-t1', distM: 1234.5, active: false });
    expect(backup.tracks[0]?.segments.map((s) => s.length)).toEqual([2, 1]);
  });
});

describe('normalizeTrack — tolerant input', () => {
  it('accepts vertex objects', () => {
    const t = normalizeTrack({ id: 't', segments: [[{ lat: 52, lng: 19, t: 5, acc: 3 }]] });
    expect(t?.segments).toEqual([[[52, 19, 5, 3]]]);
  });

  it('turns a flat points list into one segment', () => {
    const t = normalizeTrack({
      id: 't',
      points: [
        [52, 19, 1, 3],
        [52.1, 19, 2, 3],
      ],
    });
    expect(t?.segments).toHaveLength(1);
    expect(t?.end).toBe(2);
  });
});

describe('parseBackup — errors', () => {
  it('rejects JSON that is not a backup', () => {
    expect(() => parseBackup({ foo: 1 })).toThrow(/nie jest kopia/);
  });

  it('rejects backups from a newer version', () => {
    expect(() => parseBackup({ wersja: 3, points: [] })).toThrow(/nowszej wersji/);
  });
});
