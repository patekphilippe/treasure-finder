import { describe, expect, it } from 'vitest';
import { parseSubmission } from '../src/submissions/parseSubmission';

const DEVICE = 'device-1234567890abcdef';

function form(fields: Record<string, string>, files: File[] = []) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.append(k, v);
  for (const file of files) f.append('files', file);
  return f;
}
const base = { mode: 'private', deviceId: DEVICE };

describe('parseSubmission', () => {
  it('accepts a photo with a map view hint', () => {
    const photo = new File([new Uint8Array(10)], 'mapa.jpg', { type: 'image/jpeg' });
    const r = parseSubmission(
      form(
        { ...base, viewBbox: JSON.stringify({ south: 50.7, west: 15.7, north: 50.8, east: 15.8 }) },
        [photo],
      ),
    );
    expect('error' in r).toBe(false);
    if ('error' in r) return;
    expect(r.files).toHaveLength(1);
    expect(r.viewBbox).toEqual({ south: 50.7, west: 15.7, north: 50.8, east: 15.8 });
  });

  it('needs something to analyse', () => {
    expect(parseSubmission(form(base))).toEqual({ error: 'Dodaj zdjęcie mapy, opis albo link' });
  });

  it('refuses other file types, bad links and public sending without consent', () => {
    const exe = new File([new Uint8Array(3)], 'x.exe', { type: 'application/octet-stream' });
    expect(parseSubmission(form(base, [exe]))).toEqual({
      error: 'Nieobsługiwany plik: x.exe (JPG, PNG, WebP albo PDF)',
    });
    expect(parseSubmission(form({ ...base, link: 'javascript:alert(1)' }))).toEqual({
      error: 'Link musi zaczynać się od http:// lub https://',
    });
    expect(parseSubmission(form({ ...base, mode: 'public', text: 'młyn' }))).toEqual({
      error: 'Do wspólnej bazy potrzebna jest zgoda na publikację obiektów',
    });
  });

  it('ignores a malformed view hint instead of failing', () => {
    const r = parseSubmission(form({ ...base, text: 'karczma przy brodzie', viewBbox: '{oops' }));
    expect('error' in r ? r.error : r.viewBbox).toBeNull();
  });
});
