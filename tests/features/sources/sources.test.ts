// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sourcesApi } from '@/features/sources/services/sourcesApi';
import { useSourcesStore } from '@/features/sources/store/useSourcesStore';
import { toContextFeature } from '@/features/sources/utils/toContextFeature';

describe('AI source results', () => {
  afterEach(() => vi.restoreAllMocks());

  it('turns a proposed object into an archival context point (lng, lat)', () => {
    const f = toContextFeature({
      kind: 'mlyn',
      label: 'Młyn: „Mühle”',
      lat: 50.77,
      lng: 15.8,
      radiusM: 150,
      confidence: 0.8,
      reasons: [],
    });
    expect(f.kind).toBe('mlyn');
    expect(f.geometry).toEqual({ type: 'Point', coordinates: [15.8, 50.77] });
    expect(f.source).toBe('AI ze źródła: Młyn: „Mühle” (±150 m)');
  });

  it('shows the server message on errors and a Polish one when offline', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      Response.json(
        { error: 'Dzienny limit analiz został wykorzystany, spróbuj jutro' },
        { status: 429 },
      ),
    );
    await expect(sourcesApi.send(new FormData())).rejects.toThrow('Dzienny limit analiz');
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(sourcesApi.get('a', 'b')).rejects.toThrow('Brak połączenia z serwerem analizy');
  });

  it('keeps sent analyses and forgets the shown one when it is removed', () => {
    const s = useSourcesStore.getState();
    s.add({
      id: 'x1',
      accessKey: 'k',
      mode: 'private',
      label: 'mapa.jpg',
      sentAt: 1,
      view: null,
      accepted: [],
    });
    s.show('x1');
    s.update('x1', { accepted: [0] });
    expect(useSourcesStore.getState().sent[0]!.accepted).toEqual([0]);
    s.remove('x1');
    expect(useSourcesStore.getState()).toMatchObject({ sent: [], shownId: null });
  });
});
