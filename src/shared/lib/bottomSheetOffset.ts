/** Pixels to lift a fly-to target on phones, where a bottom sheet covers the lower part of the map. */
export function bottomSheetOffset(): number {
  if (typeof window === 'undefined' || window.innerWidth >= 900) return 0;
  return Math.round(window.innerHeight * 0.22);
}
