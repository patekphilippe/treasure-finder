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
  /** the sheet's own legend, read from its margin before (lines "sign: meaning"), or "" */
  legend: string;
}

/** a legend's relevant part is a few dozen short lines */
const MAX_LEGEND = 4000;

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
  const legend = String(form.get('legend') ?? '')
    .slice(0, MAX_LEGEND)
    .trim();
  return { image, w, h, res, model: model as PipelineModel, profile, legend };
}
