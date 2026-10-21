// @vitest-environment jsdom
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { useMembership } from '@/shared/store/useMembership';

const synced = vi.fn<(b: unknown) => Promise<number>>(async () => 0);
vi.mock('@/features/history/services/syncCommunity', () => ({
  syncCommunity: (b: unknown) => synced(b),
}));

const { useCommunityAutoSync } = await import('@/features/history/hooks/useCommunityAutoSync');

const poznan = { south: 52.3, west: 16.8, north: 52.5, east: 17.1 };
const inside = { south: 52.35, west: 16.9, north: 52.45, east: 17.0 };
const wroclaw = { south: 51.0, west: 16.9, north: 51.2, east: 17.2 };

function mount() {
  const Probe = () => {
    useCommunityAutoSync();
    return null;
  };
  const root = createRoot(document.createElement('div'));
  act(() => root.render(createElement(Probe)));
  return root;
}

describe('the shared base comes to the map by itself', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    synced.mockClear();
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    useMapViewStore.setState({ bounds: poznan });
  });
  afterEach(() => vi.useRealTimers());

  it('for a member: once the map rests, not again for the same area, again for a new one', () => {
    useMembership.setState({ email: 'anna@example.com', name: 'Anna', owner: false });
    const root = mount();
    vi.advanceTimersByTime(1600);
    expect(synced).toHaveBeenCalledWith(poznan);

    act(() => useMapViewStore.setState({ bounds: inside }));
    vi.advanceTimersByTime(1600);
    expect(synced).toHaveBeenCalledTimes(1);

    act(() => useMapViewStore.setState({ bounds: wroclaw }));
    vi.advanceTimersByTime(500);
    expect(synced).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1100);
    expect(synced).toHaveBeenLastCalledWith(wroclaw);
    act(() => root.unmount());
  });

  it('nothing for someone not signed in', () => {
    useMembership.setState({ email: null, name: null, owner: false });
    const root = mount();
    vi.advanceTimersByTime(5000);
    expect(synced).not.toHaveBeenCalled();
    act(() => root.unmount());
  });
});
