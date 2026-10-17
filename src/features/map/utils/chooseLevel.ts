/**
 * Index of the coarsest level that is still at least as sharp as the screen needs
 * (resolution ≤ target × 1.25); the finest level when nothing is sharp enough.
 */
export function chooseLevel(targetMetresPerPixel: number, resolutions: readonly number[]): number {
  for (let i = 0; i < resolutions.length; i++) {
    if (resolutions[i]! <= targetMetresPerPixel * 1.25) return i;
  }
  return resolutions.length - 1;
}
