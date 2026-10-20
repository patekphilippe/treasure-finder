import { isReadProfileId, type ReadProfileId } from '@/shared/lib/history/readProfiles';
import { PRICES, type PipelineModel } from '../pipeline/pricing';
import { MAX_READ_IMAGE_BYTES, READ_IMAGE_MIME, READ_MAX_SIDE } from './limits';

export interface ReadingRequest {
  image: File;
  w: number;
  h: number;
  /** metres per pixel of the view image */
  res: number;
  model: PipelineModel;
  /** which kind of map: what to look for and how (readProfiles) */
  profile: ReadProfileId;
  deviceId: string;
  turnstileToken: string;
}

/** The app's form for one view reading, checked; an error message in Polish otherwise. */
export function parseReading(form: FormData): ReadingRequest | { error: string } {
  const image = form.get('image');
  if (!(image instanceof File)) return { error: 'Brak obrazu mapy' };
  if (!(READ_IMAGE_MIME as readonly string[]).includes(image.type))
    return { error: 'Obraz mapy musi być w JPEG, PNG albo WebP' };
  if (image.size > MAX_READ_IMAGE_BYTES) return { error: 'Obraz mapy jest za duży' };
  const w = Number(form.get('w'));
  const h = Number(form.get('h'));
  const res = Number(form.get('res'));
  if (![w, h].every((v) => Number.isInteger(v) && v >= 16 && v <= READ_MAX_SIDE))
    return { error: 'Nieprawidłowy rozmiar obrazu' };
  if (!(res > 0 && res <= 10)) return { error: 'Nieprawidłowa skala obrazu' };
  const model = String(form.get('model') ?? '');
  if (!(model in PRICES)) return { error: 'Nieznany model' };
  // older apps send no profile: the topographic one
  const profile = form.get('profile') ?? 'topo';
  if (!isReadProfileId(profile)) return { error: 'Nieznany rodzaj mapy' };
  const deviceId = String(form.get('deviceId') ?? '');
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(deviceId)) return { error: 'Brak identyfikatora urządzenia' };
  const turnstileToken = String(form.get('turnstile') ?? '');
  return { image, w, h, res, model: model as PipelineModel, profile, deviceId, turnstileToken };
}
