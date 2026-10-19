import { parseMapObjects } from '@/shared/lib/history/parseMapObjects';
import type { MapReading } from '@/shared/types/readings';
import { addSpending, spentThisMonth } from '../budget';
import type { Env } from '../env';
import { fail, json } from '../http';
import { ipSubject } from '../ipSubject';
import { costUsd } from '../pipeline/pricing';
import { consumeDaily } from '../submissions/dailyLimit';
import { verifyTurnstile } from '../submissions/verifyTurnstile';
import { callClaude } from './callClaude';
import { READ_DAILY_LIMIT, READ_ESTIMATE_TOKENS } from './limits';
import { parseReading } from './parseReading';

type Cors = Record<string, string>;

/**
 * POST /api/readings: Claude reads one view of a historical map for the app (buildings, mills,
 * inns…). The image is used for this one call and not stored. Turnstile, a daily limit per device
 * and IP, and the monthly budget shared with the batch pipeline guard the owner's key.
 */
export async function readView(request: Request, env: Env, cors: Cors, now: number) {
  if (!env.TURNSTILE_SECRET || !env.ANTHROPIC_API_KEY)
    return fail(503, 'Odczyt map jest chwilowo niedostępny', cors);
  const form = await request.formData().catch(() => null);
  if (!form) return fail(400, 'Nieprawidłowe zapytanie', cors);
  const req = parseReading(form);
  if ('error' in req) return fail(400, req.error, cors);

  const { ip, subject } = await ipSubject(request, now);
  if (!(await verifyTurnstile(req.turnstileToken, env.TURNSTILE_SECRET, ip)))
    return fail(403, 'Weryfikacja nie powiodła się, spróbuj jeszcze raz', cors);

  const spent = await spentThisMonth(env.DB, now);
  if (spent + costUsd(req.model, READ_ESTIMATE_TOKENS, false) > Number(env.MONTHLY_BUDGET_USD))
    return fail(503, 'Miesięczny budżet odczytów się skończył, spróbuj w przyszłym miesiącu', cors);
  // own prefix: readings do not use up the private submissions of the day
  const allowed = await consumeDaily(
    env.DB,
    [`read:device:${req.deviceId}`, `read:${subject}`],
    READ_DAILY_LIMIT,
    now,
  );
  if (!allowed)
    return fail(429, 'Dzienny limit odczytów map został wykorzystany, spróbuj jutro', cors);

  const answer = await callClaude(
    env.ANTHROPIC_API_KEY,
    req.model,
    req.image,
    req.w,
    req.h,
    req.res,
  );
  if (answer.usage) await addSpending(env.DB, now, costUsd(req.model, answer.usage, false));
  if (!answer.ok) return fail(answer.status, answer.message, cors);

  const body: MapReading = {
    objects: parseMapObjects(answer.json, req.w, req.h),
    usage: { inputTokens: answer.usage.input_tokens, outputTokens: answer.usage.output_tokens },
  };
  return json(body, 200, cors);
}
