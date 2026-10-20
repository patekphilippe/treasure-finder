import type { MapPlacement } from '@/shared/types/placement';
import type { ViewBbox } from '@/shared/types/sources';
import { addSpending, spentThisMonth } from '../budget';
import { memberFrom, SIGN_IN_FIRST } from '../community/auth';
import type { Env } from '../env';
import { fail, json } from '../http';
import { placeMap } from '../pipeline/placeMap';
import { costUsd, FIRST_MODEL } from '../pipeline/pricing';
import { parseMapReading, squareReading } from '../pipeline/readings';
import { callClaude } from '../readings/callClaude';
import {
  MAX_READ_IMAGE_BYTES,
  READ_ESTIMATE_INPUT_TOKENS,
  READ_IMAGE_MIME,
  READ_MAX_SIDE,
  READ_MEMBER_DAILY_LIMIT,
} from '../readings/limits';
import { consumeDaily } from '../submissions/dailyLimit';
import { placementQuestion } from './question';

type Cors = Record<string, string>;

/** "s,w,n,e" in degrees inside Poland's neighbourhood, or null. */
function parseView(v: File | string | null): ViewBbox | null {
  if (typeof v !== 'string') return null;
  const [south, west, north, east] = v.split(',').map(Number);
  const ok = [south, west, north, east].every((x) => Number.isFinite(x));
  if (!ok || !(south! < north! && west! < east!) || north! - south! > 5 || east! - west! > 8)
    return null;
  return { south: south!, west: west!, north: north!, east: east! };
}

/**
 * POST /api/placements: where a scanned map lies. Claude reads its sheet number, frame and
 * names (one synchronous call), the submissions pipeline's placeMap finds them on today's map
 * and fits the scan; the answer is the image's corners. Same guards as view readings: a signed-in
 * member, the daily reading limit, the monthly budget. The image is not stored.
 */
export async function placeImage(request: Request, env: Env, cors: Cors, now: number) {
  if (!env.ANTHROPIC_API_KEY) return fail(503, 'Umieszczanie map jest chwilowo niedostępne', cors);
  const member = await memberFrom(request, env, now);
  if (!member) return fail(401, SIGN_IN_FIRST, cors);
  const form = await request.formData().catch(() => null);
  if (!form) return fail(400, 'Nieprawidłowe zapytanie', cors);
  const image = form.get('image');
  if (!(image instanceof File) || !(READ_IMAGE_MIME as readonly string[]).includes(image.type))
    return fail(400, 'Obraz mapy musi być w JPEG, PNG albo WebP', cors);
  if (image.size > MAX_READ_IMAGE_BYTES) return fail(400, 'Obraz mapy jest za duży', cors);
  const w = Number(form.get('w'));
  const h = Number(form.get('h'));
  if (![w, h].every((v) => Number.isInteger(v) && v >= 16 && v <= READ_MAX_SIDE))
    return fail(400, 'Nieprawidłowy rozmiar obrazu', cors);
  const view = parseView(form.get('view'));

  const question = placementQuestion(view);
  const estimate = { input_tokens: READ_ESTIMATE_INPUT_TOKENS, output_tokens: question.maxTokens };
  const spent = await spentThisMonth(env.DB, now);
  if (spent + costUsd(FIRST_MODEL, estimate, false) > Number(env.MONTHLY_BUDGET_USD))
    return fail(503, 'Miesięczny budżet odczytów się skończył, spróbuj w przyszłym miesiącu', cors);
  // counts as one reading of the day
  const allowed = await consumeDaily(
    env.DB,
    [`read:member:${member.id}`],
    READ_MEMBER_DAILY_LIMIT,
    now,
  );
  if (!allowed)
    return fail(429, 'Dzienny limit odczytów map został wykorzystany, spróbuj jutro', cors);

  const answer = await callClaude(env.ANTHROPIC_API_KEY, FIRST_MODEL, question, image);
  if (answer.usage) await addSpending(env.DB, now, costUsd(FIRST_MODEL, answer.usage, false));
  if (!answer.ok) return fail(answer.status, answer.message, cors);

  // positions in square units (y × height ÷ width), as the placement fits expect
  const aspect = h / w;
  const reading = squareReading(
    parseMapReading({ ...(answer.json as object), objects: [] }),
    aspect,
  );
  const placement = await placeMap(env, reading, view, now);
  if (!placement)
    return fail(
      422,
      reading.placeNames.length
        ? `Nie udało się umieścić mapy z ${reading.placeNames.length} odczytanych nazw`
        : 'Na mapie nie widać nazw ani numeru arkusza',
      cors,
    );
  const body: MapPlacement = {
    corners: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: aspect },
      { x: 0, y: aspect },
    ].map((p) => placement.toLatLng(p)),
    method: placement.method,
    rmsM: placement.rmsM,
    uncertaintyM: placement.uncertaintyM,
    anchors: placement.anchors ?? [],
    series: reading.series,
    year: reading.year,
    sheetNumber: reading.sheetNumber,
  };
  return json(body, 200, cors);
}
