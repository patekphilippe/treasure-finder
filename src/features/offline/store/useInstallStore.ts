import { create } from 'zustand';

/** Chromium's install event (not in the DOM typings). */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallState {
  /** the saved event; null where the browser has no install API (Safari, Firefox) */
  deferred: BeforeInstallPromptEvent | null;
  /** installed during this session */
  installed: boolean;
  setDeferred: (event: BeforeInstallPromptEvent | null) => void;
}

export const useInstallStore = create<InstallState>()((set) => ({
  deferred: null,
  installed: false,
  setDeferred: (deferred) => set({ deferred }),
}));

// Registered when the module loads: the event fires once, often before the data sheet is opened.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    useInstallStore.setState({ deferred: event as BeforeInstallPromptEvent });
  });
  window.addEventListener('appinstalled', () =>
    useInstallStore.setState({ deferred: null, installed: true }),
  );
}
