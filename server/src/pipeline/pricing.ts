/** USD per million tokens (docs/BACKEND.md). Batch requests cost half. */
export const PRICES = {
  'claude-haiku-5-5': { input: 0.1, output: 0.5 },
  'claude-sonnet-5-5': { input: 2, output: 10 },
} as const;
export type PipelineModel = keyof typeof PRICES;
export const FIRST_MODEL: PipelineModel = 'claude-haiku-5-5';
export const SECOND_MODEL: PipelineModel = 'claude-sonnet-5-5';
export const BATCH_DISCOUNT = 0.5;

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

export function costUsd(model: PipelineModel, usage: TokenUsage, batch: boolean): number {
  const p = PRICES[model];
  const input =
    usage.input_tokens +
    1.25 * (usage.cache_creation_input_tokens ?? 0) +
    0.1 * (usage.cache_read_input_tokens ?? 0);
  const usd = (input * p.input + usage.output_tokens * p.output) / 1e6;
  return batch ? usd * BATCH_DISCOUNT : usd;
}

/** Upper bound used before sending, so a batch never pushes spending past the budget. */
export function estimateUsd(model: PipelineModel, images: number, textChars: number): number {
  const input = 1200 + images * 1700 + textChars / 3;
  const output = 600 + images * 1500;
  return costUsd(model, { input_tokens: input, output_tokens: output }, true);
}
