import { parseMapObjects, type MapObject } from '@/shared/lib/history';
import { API_URL, READ_TOOL, readPrompt, type AiModelId } from '../config/aiReading';

export interface AiUsage {
  inputTokens: number;
  outputTokens: number;
}

/** Blob → base64 without a data: prefix. */
async function toBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000)
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/**
 * Sends one map image to Claude with the user's key (directly from the browser, nothing else is
 * sent) and returns the buildings and places it reports, in image pixels.
 */
export async function readMapWithAi(
  image: Blob,
  w: number,
  h: number,
  res: number,
  apiKey: string,
  model: AiModelId,
): Promise<{ objects: MapObject[]; usage: AiUsage }> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      tools: [READ_TOOL],
      tool_choice: { type: 'tool', name: READ_TOOL.name },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: image.type || 'image/jpeg',
                data: await toBase64(image),
              },
            },
            { type: 'text', text: readPrompt(w, h, res) },
          ],
        },
      ],
    }),
  });
  const body = (await response.json().catch(() => null)) as {
    content?: { type: string; input?: unknown }[];
    usage?: { input_tokens?: number; output_tokens?: number };
    error?: { message?: string };
  } | null;
  if (!response.ok) {
    if (response.status === 401) throw new Error('Klucz API jest nieprawidłowy');
    if (response.status === 429) throw new Error('Za dużo zapytań, spróbuj za chwilę');
    throw new Error(body?.error?.message ?? `Błąd API (${response.status})`);
  }
  const tool = body?.content?.find((c) => c.type === 'tool_use');
  return {
    objects: parseMapObjects(tool?.input, w, h),
    usage: {
      inputTokens: body?.usage?.input_tokens ?? 0,
      outputTokens: body?.usage?.output_tokens ?? 0,
    },
  };
}
