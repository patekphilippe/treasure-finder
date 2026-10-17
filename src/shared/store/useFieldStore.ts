import { create } from 'zustand';

export interface GpsFix {
  lat: number;
  lng: number;
  accM: number;
  t: number;
}

interface FieldState {
  position: GpsFix | null;
  gpsError: string | null;
  /** compass heading in degrees, null when unavailable */
  heading: number | null;
  following: boolean;
  recordingTrackId: string | null;
  setPosition: (fix: GpsFix | null) => void;
  setGpsError: (error: string | null) => void;
  setHeading: (heading: number | null) => void;
  setFollowing: (following: boolean) => void;
  setRecordingTrackId: (id: string | null) => void;
}

export const useFieldStore = create<FieldState>((set) => ({
  position: null,
  gpsError: null,
  heading: null,
  following: false,
  recordingTrackId: null,
  setPosition: (position) => set({ position }),
  setGpsError: (gpsError) => set({ gpsError }),
  setHeading: (heading) => set({ heading }),
  setFollowing: (following) => set({ following }),
  setRecordingTrackId: (recordingTrackId) => set({ recordingTrackId }),
}));
