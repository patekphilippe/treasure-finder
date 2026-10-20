import type { PipelineModel, TokenUsage } from '../pipeline/pricing';

/** What to ask about one image: instructions, the JSON schema of the answer and its length. */
export interface ImageQuestion {
  system?: string;
  text: string;
  schema: object;
  maxTokens: number;
}

const API = 'https://api.anthropic.com/v1/messages';

async function toBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000)
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export type ClaudeAnswer =
  | { ok: true; json: unknown; usage: TokenUsage }
  | { ok: false; status: number; message: string; usage: TokenUsage | null };

/** One synchronous Messages call about one image, answered in the question's JSON schema. */
export async function callClaude(
  apiKey: string,
  model: PipelineModel,
  question: ImageQuestion,
  image: File,
): Promise<ClaudeAnswer> {
  let response: Response;
  try {
    response = await fetch(API, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: question.maxTokens,
        ...(question.system ? { system: question.system } : {}),
        output_config: { format: { type: 'json_schema', schema: question.schema } },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: image.type, data: await toBase64(image) },
              },
              { type: 'text', text: question.text },
            ],
          },
        ],
      }),
    });
  } catch {
    return {
      ok: false,
      status: 502,
      message: 'Brak połączenia z modelem, spróbuj za chwilę',
      usage: null,
    };
  }
  const body = (await response.json().catch(() => null)) as {
    content?: { type: string; text?: string }[];
    stop_reason?: string;
    usage?: TokenUsage;
  } | null;
  const usage = body?.usage ?? null;
  if (!response.ok) {
    const busy = response.status === 429 || response.status === 529;
    return {
      ok: false,
      status: busy ? 503 : 502,
      message: busy ? 'Model jest przeciążony, spróbuj za chwilę' : 'Odczyt mapy nie powiódł się',
      usage,
    };
  }
  if (body?.stop_reason === 'refusal')
    return { ok: false, status: 422, message: 'Model odmówił odczytania tej mapy', usage };
  if (body?.stop_reason === 'max_tokens')
    return { ok: false, status: 422, message: 'Za dużo obiektów w widoku, przybliż mapę', usage };
  const text = body?.content?.find((c) => c.type === 'text')?.text;
  try {
    return {
      ok: true,
      json: text ? JSON.parse(text) : null,
      usage: usage ?? { input_tokens: 0, output_tokens: 0 },
    };
  } catch {
    return {
      ok: false,
      status: 502,
      message: 'Nieczytelna odpowiedź modelu, spróbuj jeszcze raz',
      usage,
    };
  }
}
