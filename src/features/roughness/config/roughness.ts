/** WMTS levels tried in order: 1.32 m/px is sharp enough for 3–10 m pits; 2.65 m/px for larger views. */
export const LEVELS = [10, 9] as const;
/** Largest mosaic (6 × 6 tiles of 512 px ≈ 4 km at 1.32 m/px, ≈ 8 km at 2.65 m/px). */
export const MAX_TILES = 36;
/** Hotspots: score threshold and minimum area. */
export const HOTSPOT_THRESHOLD = 0.35;
export const HOTSPOT_MIN_AREA_M2 = 400;
export const HOTSPOT_LIST_LIMIT = 8;
/** Heat colours: transparent below `from`, then yellow → orange → red. */
export const HEAT = {
  from: 0.15,
  stops: [
    { at: 0.15, rgba: [250, 204, 21, 90] },
    { at: 0.5, rgba: [249, 115, 22, 150] },
    { at: 1, rgba: [220, 38, 38, 200] },
  ],
} as const;
