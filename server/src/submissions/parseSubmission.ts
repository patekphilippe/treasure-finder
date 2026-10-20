import type { SubmissionMode, ViewBbox } from '@/shared/types/sources';
import { ALLOWED_MIME, MAX_FILE_BYTES, MAX_FILES, MAX_LINK_CHARS, MAX_TEXT_CHARS } from './limits';

export interface ParsedSubmission {
  mode: SubmissionMode;
  deviceId: string;
  text: string | null;
  link: string | null;
  viewBbox: ViewBbox | null;
  consentPublish: boolean;
  files: File[];
}

/** Form data → a valid submission, or a Polish message saying what is wrong. */
export function parseSubmission(form: FormData): ParsedSubmission | { error: string } {
  const mode = form.get('mode');
  if (mode !== 'public' && mode !== 'private')
    return { error: 'Wybierz, czy wysłać do wspólnej bazy' };

  const deviceId = String(form.get('deviceId') ?? '');
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(deviceId)) return { error: 'Brak identyfikatora urządzenia' };

  const text = String(form.get('text') ?? '').trim() || null;
  if (text && text.length > MAX_TEXT_CHARS)
    return { error: 'Opis jest za długi (do 20 tys. znaków)' };

  let link = String(form.get('link') ?? '').trim() || null;
  if (link) {
    if (link.length > MAX_LINK_CHARS) return { error: 'Link jest za długi' };
    try {
      const url = new URL(link);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error();
      link = url.toString();
    } catch {
      return { error: 'Link musi zaczynać się od http:// lub https://' };
    }
  }

  const files = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_FILES) return { error: `Najwyżej ${MAX_FILES} plików naraz` };
  for (const f of files) {
    if (!(ALLOWED_MIME as readonly string[]).includes(f.type))
      return { error: `Nieobsługiwany plik: ${f.name} (JPG, PNG, WebP albo PDF)` };
    if (f.size > MAX_FILE_BYTES) return { error: `Plik ${f.name} ma ponad 10 MB` };
  }
  if (!files.length && !text && !link) return { error: 'Dodaj zdjęcie mapy, opis albo link' };

  let viewBbox: ViewBbox | null = null;
  const rawBbox = form.get('viewBbox');
  if (typeof rawBbox === 'string' && rawBbox) {
    try {
      const b = JSON.parse(rawBbox) as Record<string, unknown>;
      const v = {
        south: Number(b.south),
        west: Number(b.west),
        north: Number(b.north),
        east: Number(b.east),
      };
      if (Object.values(v).every(Number.isFinite) && v.south < v.north && v.west < v.east)
        viewBbox = v;
    } catch {
      // a bad hint is ignored, not an error
    }
  }

  const consentPublish = form.get('consentPublish') === 'true';
  if (mode === 'public' && !consentPublish)
    return { error: 'Do wspólnej bazy potrzebna jest zgoda na publikację obiektów' };

  return { mode, deviceId, text, link, viewBbox, consentPublish, files };
}
