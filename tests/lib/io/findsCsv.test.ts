import { describe, expect, it } from 'vitest';
import { toFindsCsv } from '@/shared/lib/io';
import { makePoint } from '../../helpers/fixtures';

describe('toFindsCsv', () => {
  const csv = toFindsCsv([
    makePoint({ id: 'a', status: 'pusto' }),
    makePoint({
      id: 'b',
      status: 'znalezisko',
      name: 'Moneta',
      desc: 'denar; "ładny"',
      depthCm: 15,
      lat: 51.2345678,
      lng: 16.1234567,
      photoId: 'ph1',
      created: new Date(2027, 2, 14, 9, 5).getTime(),
    }),
  ]);
  const lines = csv.replace('﻿', '').trim().split('\r\n');

  it('lists only finds, with a header and BOM for Excel', () => {
    expect(csv.startsWith('﻿')).toBe(true);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe('data;nazwa;szerokosc;dlugosc;glebokosc_cm;opis;zdjecie;id');
  });

  it('writes date, coordinates, depth, escaped description and photo path', () => {
    expect(lines[1]).toBe(
      '2027-03-14 09:05;Moneta;51.234568;16.123457;15;"denar; ""ładny""";zdjecia/ph1.jpg;b',
    );
  });
});
