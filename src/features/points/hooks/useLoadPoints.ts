import { useEffect } from 'react';
import { usePointsStore } from '../store/usePointsStore';

export function useLoadPoints(): void {
  useEffect(() => {
    void usePointsStore.getState().load();
  }, []);
}
