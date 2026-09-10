import { fireEvent, render, screen } from '@testing-library/react';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatToolbar } from '@/pages/Chat/ChatToolbar';
import { CHAT_DISPLAY_DEFAULTS, useChatDisplayStore } from '@/stores/chat-display';

const { agentsState, artifactPanelState, chatState } = vi.hoisted(() => ({
  agentsState: { agents: [{ id: 'main', name: 'Main' }] },
  artifactPanelState: {
    open: false,
    tab: 'changes',
    openBrowser: vi.fn(),
    close: vi.fn(),
  },
  chatState: { currentAgentId: 'main' },
}));

vi.mock('@/stores/agents', () => ({
  useAgentsStore: (selector: (state: typeof agentsState) => unknown) => selector(agentsState),
}));

vi.mock('@/stores/artifact-panel', () => ({
  useArtifactPanel: (selector: (state: typeof artifactPanelState) => unknown) => selector(artifactPanelState),
}));

vi.mock('@/stores/chat', () => ({
  useChatStore: (selector: (state: typeof chatState) => unknown) => selector(chatState),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      'toolbar.currentAgent': 'Main',
      'toolbar.refresh': 'Refresh',
      'toolbar.workspace': 'Workspace',
      'toolbar.showThinking': 'Show thinking',
      'toolbar.hideThinking': 'Hide thinking',
      'toolbar.showToolCalls': 'Show tool calls',
      'toolbar.hideToolCalls': 'Hide tool calls',
      'questionDirectory.title': 'Question directory',
    })[key] ?? key,
  }),
}));

function renderToolbar(props: React.ComponentProps<typeof ChatToolbar> = {}) {
  return render(
    <TooltipProvider>
      <ChatToolbar {...props} />
    </TooltipProvider>,
  );
}

describe('ChatToolbar', () => {
  beforeEach(() => {
    artifactPanelState.open = false;
    artifactPanelState.tab = 'changes';
    useChatDisplayStore.setState({ ...CHAT_DISPLAY_DEFAULTS });
  });

  it('does not expose the removed refresh action', () => {
    renderToolbar();

    expect(screen.queryByRole('button', { name: 'Refresh' })).not.toBeInTheDocument();
    expect(screen.getByText('Main')).toBeInTheDocument();
  });

  it('toggles thinking and tool-call process visibility from the toolbar', () => {
    renderToolbar();

    const thinking = screen.getByTestId('chat-toggle-thinking');
    const toolCalls = screen.getByTestId('chat-toggle-tool-calls');

    expect(thinking).toHaveAttribute('aria-label', 'Hide thinking');
    expect(thinking).toHaveAttribute('aria-pressed', 'true');
    expect(toolCalls).toHaveAttribute('aria-label', 'Hide tool calls');
    expect(toolCalls).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(thinking);
    fireEvent.click(toolCalls);

    expect(thinking).toHaveAttribute('aria-label', 'Show thinking');
    expect(thinking).toHaveAttribute('aria-pressed', 'false');
    expect(toolCalls).toHaveAttribute('aria-label', 'Show tool calls');
    expect(toolCalls).toHaveAttribute('aria-pressed', 'false');
    expect(useChatDisplayStore.getState()).toMatchObject({
      showThinking: false,
      showToolCalls: false,
    });
  });
});
