import type { CompleteHostServiceRegistry } from '../main/ipc/host-contract';
import type { BubbleSyncForegroundRunPayload } from '@shared/host-api/contract';
import {
  getBubbleStateController,
  getBubbleWindowManager,
} from '../main/bubble-window';

function requireBubbleSyncPayload(payload: unknown): BubbleSyncForegroundRunPayload {
  const active = (payload as BubbleSyncForegroundRunPayload | undefined)?.active;
  if (typeof active !== 'boolean') {
    throw new Error('Invalid bubble foreground run payload');
  }
  return { active };
}

export function createBubbleApi(deps: {
  focusMainWindow: () => void;
}): CompleteHostServiceRegistry['bubble'] {
  return {
    openMainWindow: () => {
      const manager = getBubbleWindowManager();
      if (manager) {
        manager.openMainWindow();
        return;
      }
      deps.focusMainWindow();
    },
    syncForegroundRun: (payload) => {
      const { active } = requireBubbleSyncPayload(payload);
      getBubbleStateController()?.setForegroundRunActive(active);
    },
  };
}
