// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { useInstallStore } from '@/features/offline/store/useInstallStore';

describe('install prompt', () => {
  it('keeps the browser install event and blocks the default mini-infobar', () => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(useInstallStore.getState().deferred).toBe(event);
  });

  it('forgets the event once the app is installed', () => {
    window.dispatchEvent(new Event('appinstalled'));
    expect(useInstallStore.getState()).toMatchObject({ deferred: null, installed: true });
  });
});
