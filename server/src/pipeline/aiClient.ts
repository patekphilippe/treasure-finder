import Anthropic, { toFile } from '@anthropic-ai/sdk';
import type { MessageCreateParamsNonStreaming } from '@anthropic-ai/sdk/resources/messages/messages';
import type { TokenUsage } from './pricing';

export interface BatchRequest {
  custom_id: string;
  params: MessageCreateParamsNonStreaming;
}

export interface BatchOutcome {
  customId: string;
  /** parsed JSON answer; null when the request failed or the answer is unusable */
  json: unknown;
  usage: TokenUsage | null;
  error: string | null;
}

/** What the pipeline needs from Anthropic; tests use a fake with recorded answers. */
export interface AiClient {
  /** returns the Files API id; the file expires by itself after two days */
  uploadFile(name: string, mime: string, body: ReadableStream | ArrayBuffer): Promise<string>;
  deleteFile(id: string): Promise<void>;
  createBatch(requests: BatchRequest[]): Promise<string>;
  batchEnded(id: string): Promise<boolean>;
  batchResults(id: string): Promise<BatchOutcome[]>;
}

const FILE_TTL_S = 2 * 24 * 3600;

export function anthropicClient(apiKey: string): AiClient {
  const client = new Anthropic({ apiKey });
  return {
    async uploadFile(name, mime, body) {
      const file = await client.files.upload({
        file: await toFile(body, name, { type: mime }),
        expires_in_seconds: FILE_TTL_S,
      });
      return file.id;
    },
    async deleteFile(id) {
      await client.files.delete(id).catch(() => undefined);
    },
    async createBatch(requests) {
      return (await client.messages.batches.create({ requests })).id;
    },
    async batchEnded(id) {
      return (await client.messages.batches.retrieve(id)).processing_status === 'ended';
    },
    async batchResults(id) {
      const out: BatchOutcome[] = [];
      for await (const r of await client.messages.batches.results(id)) {
        if (r.result.type !== 'succeeded') {
          out.push({ customId: r.custom_id, json: null, usage: null, error: r.result.type });
          continue;
        }
        const msg = r.result.message;
        const text = msg.content.find((b) => b.type === 'text');
        let json: unknown = null;
        let error: string | null = null;
        if (msg.stop_reason === 'refusal') error = 'refusal';
        else if (msg.stop_reason === 'max_tokens') error = 'max_tokens';
        else {
          try {
            json = text && text.type === 'text' ? JSON.parse(text.text) : null;
          } catch {
            error = 'invalid_json';
          }
        }
        out.push({ customId: r.custom_id, json, usage: msg.usage, error });
      }
      return out;
    },
  };
}
