import type { ChatGet, ChatSet, RuntimeActions } from './store-api';

export function createRuntimeUiActions(set: ChatSet, get: ChatGet): Pick<
  RuntimeActions,
  'toggleThinking' | 'toggleExecutionInfo' | 'refresh' | 'clearError'
> {
  return {
    toggleThinking: () => set((s) => ({ showThinking: !s.showThinking })),
    toggleExecutionInfo: () => set((s) => ({ showExecutionInfo: !s.showExecutionInfo })),

    // ── Refresh: reload history + sessions ──

    refresh: async () => {
      const { loadHistory, loadSessions } = get();
      await Promise.all([loadHistory(), loadSessions()]);
    },

    clearError: () => set({ error: null, runError: null }),
  };
}
