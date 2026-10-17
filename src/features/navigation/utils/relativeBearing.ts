/** Angle to turn from the current heading to the target bearing, in −180…180 (positive = right). */
export function relativeBearing(bearing: number, heading: number): number {
  const diff = (((bearing - heading) % 360) + 360) % 360;
  return diff > 180 ? diff - 360 : diff;
}
