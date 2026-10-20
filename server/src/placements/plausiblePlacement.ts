type LatLng = { lat: number; lng: number };

/** the widest map a scan is placed as: a 1:100 000 sheet is ~35 km, a 1:300 000 one ~100 km */
const MAX_SIDE_KM = 150;

const km = (a: LatLng, b: LatLng) =>
  Math.hypot(
    (a.lat - b.lat) * 110.57,
    (a.lng - b.lng) * 111.32 * Math.cos((((a.lat + b.lat) / 2) * Math.PI) / 180),
  );

/**
 * Whether a scan's corners (top-left, top-right, bottom-right, bottom-left) can be one map sheet:
 * not wider than 150 km, convex, opposite sides nearly equal. Names matched across half of
 * Europe give a huge, skewed quadrilateral; then the scan is better put in the view.
 */
export function plausiblePlacement(corners: readonly LatLng[]): boolean {
  if (corners.length !== 4) return false;
  const sides = corners.map((c, i) => km(c, corners[(i + 1) % 4]!));
  if (Math.max(...sides) > MAX_SIDE_KM || Math.min(...sides) < 0.05) return false;
  const ratio = (a: number, b: number) => Math.max(a, b) / Math.min(a, b);
  if (ratio(sides[0]!, sides[2]!) > 1.6 || ratio(sides[1]!, sides[3]!) > 1.6) return false;
  // every turn the same way round: no bow-tie, no dent
  const turns = corners.map((c, i) => {
    const b = corners[(i + 1) % 4]!;
    const d = corners[(i + 2) % 4]!;
    return Math.sign((b.lng - c.lng) * (d.lat - b.lat) - (b.lat - c.lat) * (d.lng - b.lng));
  });
  return turns.every((t) => t !== 0 && t === turns[0]);
}
