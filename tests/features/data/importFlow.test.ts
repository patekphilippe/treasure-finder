import 'fake-indexeddb/auto';
import JSZip from 'jszip';
import { beforeEach, describe, expect, it } from 'vitest';
import { applyImport } from '@/features/data/services/applyImport';
import { readImportFile } from '@/features/data/services/readImportFile';
import { usePointsStore } from '@/features/points';
import { photosRepo, pointsRepo, tracksRepo } from '@/shared/db';
import v1 from '../../fixtures/kopia-v1.json';
import { clearDb } from '../../helpers/clearDb';
import { makePoint, makeTrack } from '../../helpers/fixtures';

async function v1Zip(): Promise<File> {
  const zip = new JSZip();
  zip.file('kopia.json', JSON.stringify(v1));
  zip.file('zdjecia/ph-v1-1.jpg', new Uint8Array([0xff, 0xd8, 0xff]));
  return new File([await zip.generateAsync({ type: 'arraybuffer' })], 'kopia-v1.zip');
}

describe('import flow', () => {
  beforeEach(clearDb);

  it('imports a version 1 ZIP with points, tracks and photos', async () => {
    const payload = await readImportFile(await v1Zip());
    expect(payload.kind).toBe('backup-v1');
    const summary = await applyImport(payload);

    expect(summary).toMatchObject({ pointsAdded: 2, tracksAdded: 1, photos: 1, skipped: 1 });
    expect(await photosRepo.get('ph-v1-1')).toBeDefined();
    expect((await tracksRepo.get('v1-t1'))?.active).toBe(false);
    expect(usePointsStore.getState().points).toHaveLength(2);
  });

  it('importing the same file twice changes nothing', async () => {
    await applyImport(await readImportFile(await v1Zip()));
    const again = await applyImport(await readImportFile(await v1Zip()));
    expect(again).toMatchObject({ pointsAdded: 0, pointsUpdated: 0, tracksAdded: 0, unchanged: 3 });
  });

  it('keeps a newer local point and replaces an older one', async () => {
    await pointsRepo.putMany([
      makePoint({ id: 'v1-p1', name: 'lokalny nowszy', updated: 1790000000000 }),
      makePoint({ id: 'v1-p2', name: 'lokalny starszy', updated: 1 }),
    ]);
    const s = await applyImport(await readImportFile(await v1Zip()));
    expect(s).toMatchObject({ pointsAdded: 0, pointsUpdated: 1 });
    expect((await pointsRepo.get('v1-p1'))?.name).toBe('lokalny nowszy');
    expect((await pointsRepo.get('v1-p2'))?.name).toBe('Sygnał');
  });

  it('never overwrites a track being recorded on this device', async () => {
    await tracksRepo.put(
      makeTrack({ id: 'v1-t1', active: true, start: 0, end: null, name: 'nagrywam' }),
    );
    await applyImport(await readImportFile(await v1Zip()));
    expect(await tracksRepo.get('v1-t1')).toMatchObject({ active: true, name: 'nagrywam' });
  });

  it('accepts a bare kopia.json', async () => {
    const file = new File([JSON.stringify(v1)], 'kopia.json', { type: 'application/json' });
    const s = await applyImport(await readImportFile(file));
    expect(s.pointsAdded).toBe(2);
  });

  it('imports QGIS GeoJSON points', async () => {
    const geojson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [21, 52] },
          properties: { nazwa: 'A' },
        },
      ],
    };
    const file = new File([JSON.stringify(geojson)], 'punkty.geojson');
    const payload = await readImportFile(file);
    expect(payload.kind).toBe('geojson');
    expect((await applyImport(payload)).pointsAdded).toBe(1);
  });

  it('rejects an unsupported file with a clear message', async () => {
    await expect(readImportFile(new File(['hello'], 'notatki.txt'))).rejects.toThrow(
      /Nieobsługiwany/,
    );
  });
});
