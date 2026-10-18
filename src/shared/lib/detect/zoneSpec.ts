import type { XY } from './features/lines';

/**
 * How to build the search zone of a detection (local metres). Built in searchZone.ts;
 * kept as data so the rules stay readable and the zones testable.
 */
export type ZoneSpec =
  | { kind: 'none' }
  /** convex hull of the cells + buffer, optional corridor to a point (water) */
  | { kind: 'hull'; points: XY[]; bufferM: number; corridorTo?: XY; corridorWidthM?: number }
  /** circles around points, each shifted by `shiftM` in `shiftDir` */
  | { kind: 'circles'; centres: XY[]; radiusM: number; shiftDir?: number; shiftM?: number }
  /** strip on one side of an axis (side +1 = left of travel, −1 = right) + circles at key points */
  | {
      kind: 'oneSide';
      axis: XY[];
      side: number;
      fromM: number;
      toM: number;
      circles: XY[];
      circleM: number;
    }
  /** strip on both sides of an axis + circles at key points */
  | { kind: 'bothSides'; axis: XY[]; bufferM: number; circles: XY[]; circleM: number }
  /** the area itself (union of squares) */
  | { kind: 'squares'; squares: { x0: number; y0: number; size: number }[] };

/** Exclusion zone of a protected form: hull of its cells + buffer. */
export type ExclusionSpec = { points: XY[]; bufferM: number } | null;
