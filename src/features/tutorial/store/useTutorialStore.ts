import type { Step } from 'react-joyride';
import { create } from 'zustand';
import { buildTourSteps } from '../utils/buildTourSteps';
import { isTourSeen } from '../utils/tourSeen';

interface TutorialState {
  running: boolean;
  /** changes on every start, so the tour begins from the first step */
  runId: number;
  /** fixed for the whole run, so steps don't shift while the tour goes */
  steps: Step[];
  start: () => void;
  /** first launch only */
  startIfNew: () => void;
  stop: () => void;
}

export const useTutorialStore = create<TutorialState>((set, get) => ({
  running: false,
  runId: 0,
  steps: [],
  start: () => set((s) => ({ running: true, runId: s.runId + 1, steps: buildTourSteps() })),
  startIfNew: () => {
    if (!isTourSeen() && !get().running) get().start();
  },
  stop: () => set({ running: false }),
}));
