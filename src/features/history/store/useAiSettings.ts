import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AiModelId } from '../config/aiReading';

interface AiSettingsState {
  /** the user's own Anthropic API key: kept only in this browser, never exported */
  apiKey: string;
  model: AiModelId;
  setApiKey: (apiKey: string) => void;
  setModel: (model: AiModelId) => void;
}

export const useAiSettings = create<AiSettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      model: 'claude-haiku-5-5',
      setApiKey: (apiKey) => set({ apiKey: apiKey.trim() }),
      setModel: (model) => set({ model }),
    }),
    { name: 'mapa.ai', storage: createJSONStorage(() => localStorage) },
  ),
);
