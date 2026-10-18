/**
 * Floating controls beside the dock (legend, follow button). From this width there is room
 * on both sides of the 440 px dock, so they sit at its level instead of above it.
 */
export const BESIDE_DOCK_MIN_WIDTH = 820;
/** dock: 12 px from the bottom, 56 px buttons, 2 × 6 px padding and a 1 px border */
export const DOCK_BOTTOM_PX = 12;
export const DOCK_HEIGHT_PX = 70;

/** `bottom` that centres a control of the given height on the dock. */
export const besideDockBottom = (heightPx: number) =>
  `calc(env(safe-area-inset-bottom, 0px) + ${DOCK_BOTTOM_PX + (DOCK_HEIGHT_PX - heightPx) / 2}px)`;
