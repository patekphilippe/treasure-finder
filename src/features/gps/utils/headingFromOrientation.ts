export interface OrientationReading {
  alpha: number | null;
  absolute: boolean;
  /** iOS Safari only: degrees clockwise from magnetic north */
  webkitCompassHeading?: number;
}

/**
 * Compass heading (0–360°, clockwise from north) of the top of the screen,
 * or null when the event carries no absolute orientation.
 * `screenAngle` is `screen.orientation.angle` (0, 90, 180, 270).
 */
export function headingFromOrientation(e: OrientationReading, screenAngle = 0): number | null {
  let heading: number;
  if (typeof e.webkitCompassHeading === 'number' && Number.isFinite(e.webkitCompassHeading)) {
    heading = e.webkitCompassHeading;
  } else if (e.absolute && e.alpha !== null) {
    heading = 360 - e.alpha;
  } else {
    return null;
  }
  return (((heading + screenAngle) % 360) + 360) % 360;
}
