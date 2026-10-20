import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { buildExportZip, type BackupV3 } from '@/shared/lib/io';
import { makePoint, makeTrack } from '../../helpers/fixtures';

describe('buildExportZip', () => {
  it('contains all export files, photos and kopia.json wersja 3', async () => {
    const point = makePoint({ id: 'p1', photoId: 'ph1' });
    const zip = await buildExportZip(
      { points: [point], tracks: [makeTrack()], candidates: [], zones: [], context: [] },
      new Map([['ph1', new Blob([new Uint8Array([0xff, 0xd8, 0xff])])]]),
      Date.UTC(2026, 9, 17),
    );
    const bytes = await zip.generateAsync({ type: 'uint8array' });
    const read = await JSZip.loadAsync(bytes);

    expect(Object.keys(read.files).sort()).toEqual([
      'kandydaci.geojson',
      'kopia.json',
      'poszukiwania.gpx',
      'punkty.geojson',
      'strefy.geojson',
      'strefy_poszukiwan.geojson',
      'trasy.geojson',
      'zdjecia/',
      'zdjecia/ph1.jpg',
      'znaleziska.csv',
    ]);
    const backup = JSON.parse(await read.file('kopia.json')!.async('string')) as BackupV3;
    expect(backup.wersja).toBe(3);
    expect(backup.points).toEqual([point]);
    expect(backup.utworzono).toBe('2026-10-17T00:00:00.000Z');
    expect(await read.file('zdjecia/ph1.jpg')!.async('uint8array')).toEqual(
      new Uint8Array([0xff, 0xd8, 0xff]),
    );
  });
});
