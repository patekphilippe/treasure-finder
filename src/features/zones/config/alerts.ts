/** Hysteresis: a zone border must be crossed by this many metres before the state flips… */
export const HYSTERESIS_M = 5;
/** …plus half the GPS accuracy (capped), so jitter near the border does not flicker the alert. */
export const ACCURACY_SHARE = 0.5;
export const MAX_ACCURACY_MARGIN_M = 10;

export const ALERT_VIBRATION = [400, 200, 400, 200, 400];
