import type { SubmissionStatus } from '@/shared/types/sources';
import { READY } from '../config/sourcesApi';

/** A result came with this check: the status is now a ready one and was not before. */
export function becameReady(
  before: SubmissionStatus | null | undefined,
  after: SubmissionStatus,
): boolean {
  return READY.includes(after) && !(before && READY.includes(before));
}
