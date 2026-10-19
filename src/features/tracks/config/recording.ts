/** How often the active track is written to IndexedDB. */
export const SAVE_INTERVAL_MS = 8_000;

/** A fix older than this when it arrives (e.g. the last known one at start) is not recorded. */
export const STALE_FIX_MS = 20_000;
/**
 * No fix for this long (screen locked: Safari pauses GPS): the track continues in a new
 * segment instead of a straight line across the gap.
 */
export const GAP_MS = 45_000;
/** Faster than this between fixes, beyond their accuracy circles, is a GPS jump. */
export const MAX_SPEED_MPS = 4;
/** After this many jumps in a row the position is real (e.g. moved by car): new segment. */
export const JUMPS_BEFORE_NEW_SEGMENT = 3;
