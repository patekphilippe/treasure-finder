/** Pixel density the canvas tile layers draw at (capped at 2 to keep tiles light). */
export const canvasDpr = () => Math.min(2, globalThis.devicePixelRatio || 1);
