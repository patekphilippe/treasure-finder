import { useEffect } from 'react';
import { useZonesStore } from '../store/useZonesStore';

export function useLoadZones(): void {
  useEffect(() => {
    void useZonesStore.getState().load();
  }, []);
}
