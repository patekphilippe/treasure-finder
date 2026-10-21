import { describe, expect, it } from 'vitest';
import { mapFileGroups } from '@/features/history/utils/mapFileGroups';

const file = (path: string) => ({ name: path.split('/').pop()!, webkitRelativePath: path });

describe('mapFileGroups', () => {
  it('an image with its world file is one map; other files and lone world files are left out', () => {
    const groups = mapFileGroups([
      file('wig/P50_S33_KRAKOW.jgw'),
      file('wig/P50_S33_KRAKOW.jpg'),
      file('wig/P39_S24_POZNAN.jpg'),
      file('wig/readme.txt'),
      file('wig/P50_S33_KRAKOW.jpg.part'),
      file('wig/zgubiony.tfw'),
    ]);
    expect(groups.map((g) => [g.name, g.files.map((f) => f.name)])).toEqual([
      ['P39_S24_POZNAN', ['P39_S24_POZNAN.jpg']],
      ['P50_S33_KRAKOW', ['P50_S33_KRAKOW.jgw', 'P50_S33_KRAKOW.jpg']],
    ]);
  });

  it('the same name in two subfolders stays two maps, in the order of the sheet numbers', () => {
    const groups = mapFileGroups([file('a/P9_S3.jpg'), file('b/P9_S3.jpg'), file('a/P10_S3.jpg')]);
    expect(groups.map((g) => g.name)).toEqual(['P9_S3', 'P9_S3', 'P10_S3']);
  });
});
