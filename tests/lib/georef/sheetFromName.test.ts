import { describe, expect, it } from 'vitest';
import { sheetCorners, sheetFromName } from '@/shared/lib/georef';

describe('sheetFromName', () => {
  it('reads the WIG sheet from the usual ways of writing it in a file name', () => {
    for (const name of ['P47_S40_BERESTECZKO_1937', 'p47-s40', 'WIG100k P 47 S 40', 'Pas47_Slup40'])
      expect(sheetFromName(name)).toEqual({ series: 'wig100', number: 'P47 S40' });
    // the number gives the corners
    expect(sheetCorners('wig100', sheetFromName('P39_S24_POZNAN')!.number)?.north).toBeCloseTo(
      52.5,
      9,
    );
  });

  it('a lone letter A–I is the 1:25 000 part, a town after the number is not', () => {
    expect(sheetFromName('P46-S34-E')).toEqual({ series: 'wig25', number: 'P46 S34 E' });
    expect(sheetFromName('P46_S34_E_Opole_1938')?.series).toBe('wig25');
    expect(sheetFromName('P47_S40_Ełk')?.series).toBe('wig100');
    expect(sheetFromName('P47_S40_BERESTECZKO')?.series).toBe('wig100');
  });

  it('no sheet number: nothing (a word with a P inside does not count)', () => {
    expect(sheetFromName('Messtischblatt 4868 Breslau')).toBeNull();
    expect(sheetFromName('MAPS12_S3')).toBeNull();
  });
});
