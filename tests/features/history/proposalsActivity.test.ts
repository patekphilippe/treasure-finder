import { beforeEach, describe, expect, it } from 'vitest';
import { useProposalsStore } from '@/features/history/store/useProposalsStore';
import { useActivityStore } from '@/shared/store/useActivityStore';

const task = () => useActivityStore.getState().tasks.find((t) => t.id === 'ai');

describe('AI map reading as a background task', () => {
  beforeEach(() => {
    useActivityStore.setState({ tasks: [] });
    useProposalsStore.setState({
      step: null,
      share: null,
      wholeRunning: false,
      stopRequested: false,
    });
  });

  it('a view reading shows its step without "Przerwij"', () => {
    useProposalsStore.getState().set({ step: 'Claude czyta mapę' });
    expect(task()).toMatchObject({
      label: 'Odczyt mapy (AI)',
      step: 'Claude czyta mapę',
      cancel: null,
    });
    useProposalsStore.getState().set({ step: null });
    expect(task()).toBeUndefined();
  });

  it('a whole-map reading can be stopped from the chip, after the windows in flight', () => {
    const s = useProposalsStore.getState();
    s.set({ wholeRunning: true, step: 'Cała mapa: fragment 1 z 4', share: 0 });
    expect(task()).toMatchObject({ label: 'Odczyt całej mapy (AI)', share: 0 });
    s.set({ step: 'Cała mapa: fragment 3 z 4', share: 0.5 });
    task()!.cancel!();
    expect(useProposalsStore.getState().stopRequested).toBe(true);
    expect(task()).toMatchObject({ step: 'Przerywam po bieżących fragmentach', cancel: null });
    s.set({ step: null, share: null, wholeRunning: false });
    expect(task()).toBeUndefined();
    // the next whole-map reading starts fresh
    s.set({ wholeRunning: true, step: 'Cała mapa: fragment 1 z 2' });
    expect(useProposalsStore.getState().stopRequested).toBe(false);
  });
});
