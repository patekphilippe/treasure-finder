import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AiModelId } from '../config/aiReading';

interface AiSettingsState {
  model: AiModelId;
  setModel: (model: AiModelId) => void;
}

export const useAiSettings = create<AiSettingsState>()(
  persist(
    (set) => ({
      model: 'claude-haiku-5-5',
      setModel: (model) => set({ model }),
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
      partialize: (s) => ({ model: s.model }),
    },
  ),
);
