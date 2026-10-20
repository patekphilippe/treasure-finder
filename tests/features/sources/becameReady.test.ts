// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { useSourcesStore, type SentSource } from '@/features/sources/store/useSourcesStore';
import { becameReady } from '@/features/sources/utils/becameReady';

describe('a result of a sent source', () => {
  it('is new once: when the status turns ready, failed included', () => {
    expect(becameReady('w_kolejce', 'gotowe')).toBe(true);
    expect(becameReady('nowe', 'do_przegladu')).toBe(true);
    expect(becameReady(undefined, 'gotowe')).toBe(true);
    expect(becameReady('w_kolejce', 'blad')).toBe(true);
    expect(becameReady('do_przegladu', 'do_przegladu')).toBe(false);
    expect(becameReady('do_przegladu', 'gotowe')).toBe(false);
    expect(becameReady('nowe', 'w_kolejce')).toBe(false);
    expect(becameReady('nowe', 'czeka_na_budzet')).toBe(false);
  });

  it('counts as seen once "Moje źródła" was open', () => {
    const sent = (id: string, fresh?: boolean): SentSource => ({
      id,
      accessKey: 'k',
      mode: 'private',
      label: id,
      sentAt: 0,
      view: null,
      accepted: [],
      ...(fresh !== undefined && { fresh }),
    });
    useSourcesStore.setState({ sent: [sent('a', true), sent('b')] });
    useSourcesStore.getState().markSeen();
    expect(useSourcesStore.getState().sent.map((s) => s.fresh)).toEqual([false, undefined]);
  });
});
