import { describe, expect, it } from 'vitest';
import { activitySummary } from '@/app/utils/activitySummary';
import type { Activity } from '@/shared/store/useActivityStore';

const task = (p: Partial<Activity>): Activity => ({
  id: 'nmt',
  label: 'Arkusz NMT a.asc',
  short: 'Arkusz NMT',
  share: null,
  step: null,
  cancel: null,
  open: null,
  startedAt: 0,
  ...p,
});
const none = { waiting: 0, ready: 0 };

describe('what the activity chip says', () => {
  it('one task with its percent; on a phone only the percent', () => {
    expect(activitySummary([task({ share: 0.453 })], none, false)).toEqual({
      label: 'Arkusz NMT 45%',
      tone: 'busy',
      share: 0.453,
    });
    expect(activitySummary([task({ share: 0.453 })], none, true)?.label).toBe('45%');
    expect(activitySummary([task({})], none, true)?.label).toBe('Arkusz NMT');
  });

  it('several tasks as a count, then results ready, then the server, else nothing', () => {
    expect(activitySummary([task({}), task({ id: 'ai' })], none, false)?.label).toBe('W toku: 2');
    expect(activitySummary([], { waiting: 1, ready: 2 }, false)).toEqual({
      label: 'Gotowe: 2',
      tone: 'ready',
      share: null,
    });
    expect(activitySummary([], { waiting: 1, ready: 0 }, false)?.label).toBe('Na serwerze: 1');
    expect(activitySummary([], { waiting: 1, ready: 0 }, true)?.label).toBe('Serwer: 1');
    expect(activitySummary([task({})], { waiting: 3, ready: 1 }, false)?.tone).toBe('busy');
    expect(activitySummary([], none, false)).toBeNull();
  });
});
