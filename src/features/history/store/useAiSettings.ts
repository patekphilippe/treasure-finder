import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ReadProfileId } from '@/shared/lib/history';
import type { AiModelId } from '../config/aiReading';

interface AiSettingsState {
  model: AiModelId;
  /** the kind of map being read (topographic or military) */
  profile: ReadProfileId;
  setModel: (model: AiModelId) => void;
  setProfile: (profile: ReadProfileId) => void;
}

export const useAiSettings = create<AiSettingsState>()(
  persist(
    (set) => ({
      model: 'claude-haiku-5-5',
      profile: 'topo',
      setModel: (model) => set({ model }),
      setProfile: (profile) => set({ profile }),
    }),
    {
      name: 'mapa.ai',
      storage: createJSONStorage(() => localStorage),
      // version 0 kept the user's own Anthropic key here: the reading now goes through the
      // backend, so the key is dropped from this browser
      version: 1,
      migrate: (old) => ({
        model: (old as { model?: AiModelId } | null)?.model ?? 'claude-haiku-5-5',
      }),
      partialize: (s) => ({ model: s.model, profile: s.profile }),
    },
  ),
);
