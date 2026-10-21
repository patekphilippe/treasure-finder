import { describe, expect, it } from 'vitest';
import { readableMapName } from '@/features/history/utils/readableMapName';

describe('map names as people read them', () => {
  it('a file name gets spaces so it can wrap on a phone', () => {
    expect(readableMapName('P44_S24_(424)_BRESLAU_(Wroclaw)_1933__err')).toBe(
      'P44 S24 (424) BRESLAU (Wroclaw) 1933 err',
    );
    expect(readableMapName('301 Poznań')).toBe('301 Poznań');
  });
});
