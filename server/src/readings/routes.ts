import { parseLegend } from '@/shared/lib/history/parseLegend';
import { parseMapObjects } from '@/shared/lib/history/parseMapObjects';
import { READ_PROFILES } from '@/shared/lib/history/readProfiles';
import type { MapReading } from '@/shared/types/readings';
import { addSpending, spentThisMonth } from '../budget';
import type { Env } from '../env';
import { fail, json } from '../http';
import { costUsd } from '../pipeline/pricing';
import { consumeDaily } from '../submissions/dailyLimit';
import { memberFrom, SIGN_IN_FIRST } from '../community/auth';
import { callClaude } from './callClaude';
import { READ_ESTIMATE_INPUT_TOKENS, READ_MEMBER_DAILY_LIMIT } from './limits';
import { parseReading } from './parseReading';

type Cors = Record<string, string>;

/**
 * POST /api/readings: Claude reads one view of a historical map for the app (buildings, mills,
 * inns…). The image is used for this one call and not stored. Only signed-in members use the
 * owner's key, each with a daily limit, under the monthly budget shared with the batch pipeline.
 */
export async function readView(request: Request, env: Env, cors: Cors, now: number) {
  if (!env.ANTHROPIC_API_KEY) return fail(503, 'Odczyt map jest chwilowo niedostępny', cors);
  const member = await memberFrom(request, env, now);
  if (!member) return fail(401, SIGN_IN_FIRST, cors);
  const form = await request.formData().catch(() => null);
  if (!form) return fail(400, 'Nieprawidłowe zapytanie', cors);
  const req = parseReading(form);
  if ('error' in req) return fail(400, req.error, cors);

  const profile = READ_PROFILES[req.profile];
  // upper bound of this reading's cost, checked against the monthly budget before calling
  const estimate = { input_tokens: READ_ESTIMATE_INPUT_TOKENS, output_tokens: profile.maxTokens };
  const spent = await spentThisMonth(env.DB, now);
  if (spent + costUsd(req.model, estimate, false) > Number(env.MONTHLY_BUDGET_USD))
    return fail(503, 'Miesięczny budżet odczytów się skończył, spróbuj w przyszłym miesiącu', cors);
  // own prefix: readings do not use up the private submissions of the day
  const allowed = await consumeDaily(
    env.DB,
    [`read:member:${member.id}`],
    READ_MEMBER_DAILY_LIMIT,
    now,
  );
  if (!allowed)
    return fail(429, 'Dzienny limit odczytów map został wykorzystany, spróbuj jutro', cors);

  const answer = await callClaude(
    env.ANTHROPIC_API_KEY,
    req.model,
    {
      text:
        profile.prompt(req.w, req.h, req.res) +
        (req.legend
          ? `\n\nThe legend printed on this very sheet (read from its margin), for its signs and abbreviations:\n${req.legend}\nUse it to recognise what is printed; report only the kinds asked for above.`
          : ''),
      schema: profile.schema,
      maxTokens: profile.maxTokens,
    },
    req.image,
  );
  if (answer.usage) await addSpending(env.DB, now, costUsd(req.model, answer.usage, false));
  if (!answer.ok) return fail(answer.status, answer.message, cors);

  const usage = {
    inputTokens: answer.usage.input_tokens,
    outputTokens: answer.usage.output_tokens,
  };
  const body: MapReading =
    profile.answer === 'legend'
      ? { objects: [], usage, legend: parseLegend(answer.json) }
      : { objects: parseMapObjects(answer.json, req.w, req.h, profile.kinds), usage };
  return json(body, 200, cors);
}
