import { create } from 'zustand';

export interface GpsFix {
  lat: number;
  lng: number;
  accM: number;
  t: number;
}

interface FieldState {
  position: GpsFix | null;
  /** compass heading in degrees, null when unavailable */
  heading: number | null;
  following: boolean;
  recordingTrackId: string | null;
  setPosition: (fix: GpsFix | null) => void;
  setHeading: (heading: number | null) => void;
  setFollowing: (following: boolean) => void;
  setRecordingTrackId: (id: string | null) => void;
}

export const useFieldStore = create<FieldState>((set) => ({
  position: null,
  heading: null,
  following: false,
  recordingTrackId: null,
  setPosition: (position) => set({ position }),
  setHeading: (heading) => set({ heading }),
  setFollowing: (following) => set({ following }),
  setRecordingTrackId: (recordingTrackId) => set({ recordingTrackId }),
}));
