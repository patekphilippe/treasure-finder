import { markTourTarget } from './markTourTarget';
import { scrollIntoSheet } from './scrollIntoSheet';
import {
  useUiStore,
  type AnalysesCardId,
  type AppMode,
  type SheetId,
} from '@/shared/store/useUiStore';

const SHEET_SLIDE_MS = 350;
const TARGET_WAIT_MS = 4000;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Polls until the element is on screen; the analysis view loads lazily on first open. */
async function waitForTarget(selector: string): Promise<Element | null> {
  const until = Date.now() + TARGET_WAIT_MS;
  while (Date.now() < until) {
    const el = document.querySelector(selector);
    if (el && el.getClientRects().length > 0) return el;
    await wait(100);
  }
  return null;
}

/**
 * Switches the mode and opens the sheet a step points at, then waits for the target.
 * Joyride skips its own target polling when a step has a `before` hook.
 */
export async function showTourView(
  mode: AppMode,
  sheet: SheetId | null,
  selector: string,
  card?: AnalysesCardId,
): Promise<void> {
  markTourTarget(null);
  const ui = useUiStore.getState();
  if (ui.mode !== mode) ui.setMode(mode);
  if (useUiStore.getState().activeSheet !== sheet) {
    if (sheet) ui.showSheet(sheet);
    else ui.closeSheet();
    await wait(SHEET_SLIDE_MS);
  }
  if (card && useUiStore.getState().analysesCard !== card) {
    useUiStore.getState().showAnalyses(card);
    await wait(SHEET_SLIDE_MS);
  }
  const el = await waitForTarget(selector);
  if (el && sheet) {
    scrollIntoSheet(el);
    markTourTarget(selector);
  }
}
