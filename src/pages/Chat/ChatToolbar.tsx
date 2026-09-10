/**
 * Chat Toolbar
 * Session selector, question directory, workspace browser, and
 * thinking / tool-call visibility toggles. Rendered in the Chat
 * page header.
 */
import { useMemo } from 'react';
import { Bot, Brain, FolderTree, ListTree, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useChatStore } from '@/stores/chat';
import { useChatDisplayStore } from '@/stores/chat-display';
import { useAgentsStore } from '@/stores/agents';
import { useArtifactPanel } from '@/stores/artifact-panel';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { WORKSPACE_BROWSER_ENABLED } from '@/components/file-preview/workspace-browser-config';

export type ChatToolbarProps = {
  questionDirectoryOpen?: boolean;
  questionDirectoryCount?: number;
  onToggleQuestionDirectory?: () => void;
  workspaceAvailable?: boolean;
};

export function ChatToolbar({
  questionDirectoryOpen = false,
  questionDirectoryCount = 0,
  onToggleQuestionDirectory,
  workspaceAvailable = false,
}: ChatToolbarProps = {}) {
  const currentAgentId = useChatStore((s) => s.currentAgentId);
  const showThinking = useChatDisplayStore((s) => s.showThinking);
  const toggleThinking = useChatDisplayStore((s) => s.toggleThinking);
  const showToolCalls = useChatDisplayStore((s) => s.showToolCalls);
  const toggleToolCalls = useChatDisplayStore((s) => s.toggleToolCalls);
  const agents = useAgentsStore((s) => s.agents);
  const openBrowser = useArtifactPanel((s) => s.openBrowser);
  const panelOpen = useArtifactPanel((s) => s.open);
  const panelTab = useArtifactPanel((s) => s.tab);
  const closePanel = useArtifactPanel((s) => s.close);
  const { t } = useTranslation('chat');
  const currentAgent = useMemo(
    () => (agents ?? []).find((agent) => agent.id === currentAgentId) ?? null,
    [agents, currentAgentId],
  );
  const currentAgentName = currentAgent?.name ?? currentAgentId;

  const browserActive = WORKSPACE_BROWSER_ENABLED && panelOpen && panelTab === 'browser';
  const questionDirectoryAvailable = questionDirectoryCount > 1 && !!onToggleQuestionDirectory;

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-medium text-foreground/80 dark:border-white/10 dark:bg-white/5">
        <Bot className="h-3.5 w-3.5 text-primary" />
        <span>{t('toolbar.currentAgent', { agent: currentAgentName })}</span>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            data-testid="chat-toggle-thinking"
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8 hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10',
              showThinking && 'bg-foreground/10 text-foreground',
            )}
            onClick={toggleThinking}
            aria-label={showThinking ? t('toolbar.hideThinking') : t('toolbar.showThinking')}
            aria-pressed={showThinking}
          >
            <Brain className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{showThinking ? t('toolbar.hideThinking') : t('toolbar.showThinking')}</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            data-testid="chat-toggle-tool-calls"
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8 hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10',
              showToolCalls && 'bg-foreground/10 text-foreground',
            )}
            onClick={toggleToolCalls}
            aria-label={showToolCalls ? t('toolbar.hideToolCalls') : t('toolbar.showToolCalls')}
            aria-pressed={showToolCalls}
          >
            <Wrench className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{showToolCalls ? t('toolbar.hideToolCalls') : t('toolbar.showToolCalls')}</p>
        </TooltipContent>
      </Tooltip>
      {WORKSPACE_BROWSER_ENABLED && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              data-testid="chat-toolbar-workspace"
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8 hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10',
                browserActive && 'bg-foreground/10 text-foreground',
              )}
              onClick={() => (browserActive ? closePanel() : openBrowser())}
              disabled={!workspaceAvailable}
              aria-label={t('toolbar.workspace')}
            >
              <FolderTree className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('toolbar.workspace')}</p>
          </TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            data-testid="chat-question-directory-toggle"
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8 hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10',
              questionDirectoryOpen && 'bg-foreground/10 text-foreground',
            )}
            onClick={onToggleQuestionDirectory}
            disabled={!questionDirectoryAvailable}
            aria-label={t('questionDirectory.title')}
            aria-controls="chat-question-directory"
            aria-expanded={questionDirectoryOpen}
          >
            <ListTree className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('questionDirectory.title')}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
