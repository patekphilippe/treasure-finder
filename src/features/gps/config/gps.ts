/** Fixes less accurate than this are not recorded. */
export const MAX_ACCURACY_M = 30;
/** Fixes closer than this to the previous recorded one are skipped. */
export const MIN_STEP_M = 2;

export const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 30_000,
};
