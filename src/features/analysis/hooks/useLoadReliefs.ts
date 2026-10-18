import { useEffect } from 'react';
import { useReliefStore } from '../store/useReliefStore';

export function useLoadReliefs(): void {
  useEffect(() => {
    void useReliefStore.getState().load();
  }, []);
}
