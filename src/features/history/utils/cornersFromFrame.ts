import { applyHomography, fitHomography } from '@/shared/lib/georef';

/**
 * The image corners on the map (top-left first) from its frame corners in pixels and where those
 * lie: the frame fitted in degrees, like the backend's placement by sheet.
 */
export function cornersFromFrame(
  frame: readonly { x: number; y: number }[],
  at: readonly { lat: number; lng: number }[],
  width: number,
  height: number,
): { lat: number; lng: number }[] {
  const h = fitHomography(
    frame,
    at.map((p) => ({ x: p.lng, y: p.lat })),
  );
  return [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ].map((c) => {
    const q = applyHomography(h, c);
    return { lat: q.y, lng: q.x };
  });
}
