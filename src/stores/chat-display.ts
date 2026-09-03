/**
 * Chat transcript display preferences.
 *
 * Controls whether ACP thought blocks and tool-call process cards are
 * shown in the conversation timeline.
 */
import { create } from 'zustand';

export const CHAT_DISPLAY_DEFAULTS = {
  showThinking: true,
  showToolCalls: true,
} as const;

interface ChatDisplayState {
  showThinking: boolean;
  showToolCalls: boolean;
  toggleThinking: () => void;
  toggleToolCalls: () => void;
}

export const useChatDisplayStore = create<ChatDisplayState>()((set) => ({
  ...CHAT_DISPLAY_DEFAULTS,
  toggleThinking: () => set((state) => ({ showThinking: !state.showThinking })),
  toggleToolCalls: () => set((state) => ({ showToolCalls: !state.showToolCalls })),
}));
