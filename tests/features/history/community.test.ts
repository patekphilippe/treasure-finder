import { describe, expect, it } from 'vitest';
import { invitationFromHash } from '@/features/history/utils/invitationFromHash';
import { mergeCommunity } from '@/features/history/utils/mergeCommunity';
import { toNewCommunityObject } from '@/features/history/utils/toNewCommunityObject';
import { isDisputed, type CommunityObject } from '@/shared/types/community';
import type { ContextFeature } from '@/shared/types/domain';

const area = { south: 50.7, west: 15.7, north: 50.9, east: 15.9 };
const remote = (id: string, patch: Partial<CommunityObject> = {}): CommunityObject => ({
  id,
  kind: 'mlyn',
  label: 'Młyn',
  lat: 50.8,
  lng: 15.8,
  radiusM: 150,
  source: 'Messtischblatt 1886',
  author: 'Anna',
  mineAuthor: false,
  createdAt: 1,
  up: 0,
  down: 0,
  mine: 0,
  ...patch,
});
const local = (
  id: string,
  community?: ContextFeature['community'],
  at: [number, number] = [15.8, 50.8],
): ContextFeature => ({
  id,
  kind: 'mlyn',
  geometry: { type: 'Point', coordinates: at },
  source: 'zaznaczone ręcznie',
  ...(community ? { community } : {}),
});
const link = (id: string, patch: Partial<NonNullable<ContextFeature['community']>> = {}) => ({
  id,
  author: 'Anna',
  mineAuthor: false,
  up: 0,
  down: 0,
  mine: 0 as const,
  ...patch,
});

describe('merging the shared base into local objects', () => {
  it('a new shared object becomes a local one with its author and source', () => {
    const { put, remove } = mergeCommunity([], [remote('a1')], area);
    expect(remove).toEqual([]);
    expect(put).toEqual([
      expect.objectContaining({
        id: 'wspolna-a1',
        kind: 'mlyn',
        geometry: { type: 'Point', coordinates: [15.8, 50.8] },
        source: 'Społeczność: Anna · Młyn · Messtischblatt 1886',
        community: link('a1'),
      }),
    ]);
  });

  it('known objects only get new votes; unchanged ones are left alone', () => {
    const mine = local('x', link('a1'));
    expect(mergeCommunity([mine], [remote('a1')], area).put).toEqual([]);
    const { put } = mergeCommunity([mine], [remote('a1', { up: 3, mine: 1 })], area);
    expect(put).toEqual([{ ...mine, community: link('a1', { up: 3, mine: 1 }) }]);
  });

  it('gone from the base: others’ objects disappear, my own stays private, outside the area untouched', () => {
    const others = local('o', link('b1'));
    const own = local('m', link('b2', { mineAuthor: true, author: 'Ja' }));
    const far = local('f', link('b3'), [18, 52]);
    const { put, remove } = mergeCommunity([others, own, far], [], area);
    expect(remove).toEqual(['o']);
    expect(put).toEqual([{ ...own, community: undefined }]);
  });

  it('two disputes more than confirmations make an object disputed', () => {
    expect(isDisputed({ up: 0, down: 2 })).toBe(true);
    expect(isDisputed({ up: 1, down: 2 })).toBe(false);
  });
});

describe('joining and sharing', () => {
  it('reads the invited address from the invitation link only', () => {
    expect(invitationFromHash('#zaproszenie=Jan.Kowalski%2Bmapa%40gmail.com')).toBe(
      'jan.kowalski+mapa@gmail.com',
    );
    expect(invitationFromHash('#zaproszenie')).toBe('');
    expect(invitationFromHash('#zaproszenie=nie-adres')).toBe('');
    expect(invitationFromHash('#zaproszenie=%E0%A4%A')).toBe('');
    // old code links still start signing in
    expect(invitationFromHash('#dolacz=abcdefghijklmnop_-1234')).toBe('');
    expect(invitationFromHash('#admin')).toBeNull();
    expect(invitationFromHash('')).toBeNull();
  });

  it('a local object is shared as a point with its kind, label and source', () => {
    expect(toNewCommunityObject(local('x'))).toEqual({
      kind: 'mlyn',
      label: 'Młyn',
      lat: 50.8,
      lng: 15.8,
      source: 'zaznaczone ręcznie',
    });
  });
});
