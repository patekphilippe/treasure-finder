import { create } from 'zustand';
import type { ZoneAlert } from '../utils/zoneAlert';

interface ZoneAlertState {
  alert: ZoneAlert | null;
  setAlert: (alert: ZoneAlert | null) => void;
}

export const useZoneAlertStore = create<ZoneAlertState>((set) => ({
  alert: null,
  setAlert: (alert) => set({ alert }),
}));
