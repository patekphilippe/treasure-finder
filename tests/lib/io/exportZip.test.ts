import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { buildExportZip, type BackupV4 } from '@/shared/lib/io';
import { makeOwnMap, makePoint, makeTrack } from '../../helpers/fixtures';

describe('buildExportZip', () => {
  it('contains all export files, photos, own maps and kopia.json wersja 4', async () => {
    const point = makePoint({ id: 'p1', photoId: 'ph1' });
    const map = makeOwnMap({ id: 'm1' });
    const zip = await buildExportZip(
      {
        points: [point],
        tracks: [makeTrack()],
        candidates: [],
        zones: [],
        context: [],
        maps: [map],
      },
      new Map([['ph1', new Blob([new Uint8Array([0xff, 0xd8, 0xff])])]]),
      Date.UTC(2026, 9, 17),
    );
    const bytes = await zip.generateAsync({ type: 'uint8array' });
    const read = await JSZip.loadAsync(bytes);

    expect(Object.keys(read.files).sort()).toEqual([
      'kandydaci.geojson',
      'kopia.json',
      'mapy/',
      'mapy/m1.webp',
      'poszukiwania.gpx',
      'punkty.geojson',
      'strefy.geojson',
      'strefy_poszukiwan.geojson',
      'trasy.geojson',
      'zdjecia/',
      'zdjecia/ph1.jpg',
      'znaleziska.csv',
    ]);
    const backup = JSON.parse(await read.file('kopia.json')!.async('string')) as BackupV4;
    expect(backup.wersja).toBe(4);
    // the image lies beside, the entry names it
    const { image, ...meta } = map;
    expect(backup.maps).toEqual([{ ...meta, image: 'mapy/m1.webp' }]);
    expect(await read.file('mapy/m1.webp')!.async('uint8array')).toEqual(
      new Uint8Array(await image.arrayBuffer()),
    );
    expect(backup.points).toEqual([point]);
    expect(backup.utworzono).toBe('2026-10-17T00:00:00.000Z');
    expect(await read.file('zdjecia/ph1.jpg')!.async('uint8array')).toEqual(
      new Uint8Array([0xff, 0xd8, 0xff]),
    );
  });
});
