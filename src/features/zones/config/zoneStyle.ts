import type { Zone } from '@/shared/types/domain';

export const ZONE_STYLE: Record<Zone['kind'], { label: string; color: string; icon: string }> = {
  zgoda: { label: 'Zgoda', color: '#16a34a', icon: 'check-square' },
  zakaz: { label: 'Zakaz', color: '#dc2626', icon: 'ban' },
};
