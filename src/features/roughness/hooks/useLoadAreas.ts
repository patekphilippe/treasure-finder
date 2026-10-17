import { useEffect } from 'react';
import { useAreasStore } from '../store/useAreasStore';

export function useLoadAreas(): void {
  useEffect(() => {
    void useAreasStore.getState().load();
  }, []);
}
