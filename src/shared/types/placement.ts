/** Answer of the backend's POST /api/placements: where a scanned map lies. */
export interface MapPlacement {
  /** the image's corners: north-west, north-east, south-east, south-west (top-left first) */
  corners: { lat: number; lng: number }[];
  /** "arkusz": from the printed sheet number and frame; "nazwy": from place names */
  method: 'arkusz' | 'nazwy';
  /** fit error in metres; null for an exact fit */
  rmsM: number | null;
  /** how far a point of the placed map may be off */
  uncertaintyM: number;
  /** names the placement rests on */
  anchors: string[];
  /** e.g. "messtischblatt", and what else was read */
  series: string;
  year: number | null;
  sheetNumber: string | null;
  /**
   * Placed by the sheet frame: its corners as read (fractions of the image, top-left first) and
   * where they lie. The app snaps them to the frame lines of the full scan and fits again.
   */
  frame?: { image: { x: number; y: number }[]; at: { lat: number; lng: number }[] };
}
