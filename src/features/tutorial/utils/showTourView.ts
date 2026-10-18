import { useUiStore, type AppMode, type SheetId } from '@/shared/store/useUiStore';

const SHEET_SLIDE_MS = 350;
const TARGET_WAIT_MS = 4000;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Polls until the element is on screen; the analysis view loads lazily on first open. */
async function waitForTarget(selector: string): Promise<void> {
  const until = Date.now() + TARGET_WAIT_MS;
  while (Date.now() < until) {
    const el = document.querySelector(selector);
    if (el && el.getClientRects().length > 0) return;
    await wait(100);
  }
}

/**
 * Switches the mode and opens the sheet a step points at, then waits for the target.
 * Joyride skips its own target polling when a step has a `before` hook.
 */
export async function showTourView(
  mode: AppMode,
  sheet: SheetId | null,
  selector: string,
): Promise<void> {
  const ui = useUiStore.getState();
  if (ui.mode !== mode) ui.setMode(mode);
  if (useUiStore.getState().activeSheet !== sheet) {
    if (sheet) ui.showSheet(sheet);
    else ui.closeSheet();
    await wait(SHEET_SLIDE_MS);
  }
  await waitForTarget(selector);
}
