export interface MergeResult<T> {
  /** records to write (new or newer than the local copy) */
  toWrite: T[];
  added: number;
  updated: number;
  unchanged: number;
}

/** Merge by id: new records are added, existing ones replaced only when `isNewer`. */
export function mergeRecords<T extends { id: string }>(
  existing: readonly T[],
  incoming: readonly T[],
  isNewer: (incoming: T, local: T) => boolean,
): MergeResult<T> {
  const local = new Map(existing.map((r) => [r.id, r]));
  const result: MergeResult<T> = { toWrite: [], added: 0, updated: 0, unchanged: 0 };
  for (const record of incoming) {
    const current = local.get(record.id);
    if (!current) {
      result.toWrite.push(record);
      result.added++;
    } else if (isNewer(record, current)) {
      result.toWrite.push(record);
      result.updated++;
    } else {
      result.unchanged++;
    }
  }
  return result;
}
