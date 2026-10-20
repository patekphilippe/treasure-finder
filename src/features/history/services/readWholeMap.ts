import type { ReadProfileId } from '@/shared/lib/history';
import type { Bounds } from '@/shared/store/useMapViewStore';
import { PROPOSAL_OPTIONS, type AiModelId } from '../config/aiReading';
import { mergeChunkProposals } from '../utils/mergeChunkProposals';
import type { ViewSource } from './captureView';
import { findLostBuildings, type Proposal } from './findLostBuildings';
import type { AiUsage } from './readMapWithAi';

/** windows read at once: twice as fast, still gentle on the shared budget's rate */
const PARALLEL = 2;
/** a named place read in two overlapping windows */
const DUPLICATE_M = 40;

export interface WholeMapResult {
  proposals: Proposal[];
  usage: AiUsage;
  read: number;
  /** windows that failed (the rest is still shown) */
  failed: number;
  /** why reading stopped early (daily limit, budget), or null */
  stopped: string | null;
}

/**
 * Reads a whole own map window by window (wholeMapChunks) with the member's code and merges
 * what the windows found. A daily limit or an exhausted budget stops it; what was read stays.
 */
export async function readWholeMap(
  source: ViewSource,
  chunks: readonly Bounds[],
  model: AiModelId,
  profile: ReadProfileId,
  onProgress: (done: number) => void,
  isCancelled: () => boolean,
): Promise<WholeMapResult> {
  const found: Proposal[] = [];
  const usage: AiUsage = { inputTokens: 0, outputTokens: 0 };
  let read = 0;
  let failed = 0;
  let done = 0;
  let stopped: string | null = null;
  const queue = [...chunks];
  const worker = async () => {
    for (let chunk; !stopped && !isCancelled() && (chunk = queue.shift());) {
      try {
        const r = await findLostBuildings(chunk, source, model, profile, () => {});
        found.push(...r.proposals);
        usage.inputTokens += r.usage.inputTokens;
        usage.outputTokens += r.usage.outputTokens;
        read += r.read;
      } catch (e) {
        failed++;
        const message = e instanceof Error ? e.message : '';
        // nothing more will pass today or this month: stop instead of failing every window
        if (/limit|budżet/i.test(message)) stopped = message;
      }
      onProgress(++done);
    }
  };
  await Promise.all(Array.from({ length: PARALLEL }, worker));
  return {
    proposals: mergeChunkProposals(found, PROPOSAL_OPTIONS.linkM, DUPLICATE_M),
    usage,
    read,
    failed,
    stopped,
  };
}
