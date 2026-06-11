/**
 * Desktop floating bubble window manager
 */
import { BrowserWindow, type BrowserWindow as BrowserWindowType } from 'electron';
import { join } from 'node:path';
import type { BubbleVisualState } from '@shared/host-api/contract';
import type { AppSettings } from '../utils/store';
import { getSetting } from '../utils/store';
import { logger } from '../utils/logger';
import {
  BUBBLE_COMPACT_HEIGHT,
  BUBBLE_COMPACT_WIDTH,
  getBubblePosition,
  isPointInSphere,
  saveBubblePosition,
  snapBubbleBounds,
} from './bubble-position';
import { attachBubbleInputHandlers } from './bubble-input';
import { BubbleStateController } from './bubble-state';

export function isBubbleEnabledInCurrentProcess(): boolean {
  if (process.env.SMARTX_E2E === '1' && process.env.SMARTX_E2E_BUBBLE !== '1') {
    return false;
  }
  return true;
}

type BubbleWindowManagerDeps = {
  getMainWindow: () => BrowserWindowType | null;
  focusMainWindow: () => void;
  getStateController: () => BubbleStateController | null;
};

export class BubbleWindowManager {
  private bubbleWindow: BrowserWindow | null = null;
  private mainWindowListenersAttached = false;
  private stateUnsubscribe: (() => void) | null = null;
  private visibilityMode: AppSettings['bubbleVisibility'] = 'always';
  private isQuitting = false;
  private pendingShow = false;

  constructor(private readonly deps: BubbleWindowManagerDeps) {}

  async init(): Promise<void> {
    if (!isBubbleEnabledInCurrentProcess()) {
      logger.info('Bubble window disabled in current process mode');
      return;
    }

    this.visibilityMode = await getSetting('bubbleVisibility');
    this.attachMainWindowListeners();
    this.subscribeToVisualState();
    await this.syncVisibility();
  }

  setQuitting(): void {
    this.isQuitting = true;
  }

  destroy(): void {
    this.stateUnsubscribe?.();
    this.stateUnsubscribe = null;
    if (this.bubbleWindow && !this.bubbleWindow.isDestroyed()) {
      this.bubbleWindow.destroy();
    }
    this.bubbleWindow = null;
  }

  async applyVisibilitySetting(mode: AppSettings['bubbleVisibility']): Promise<void> {
    this.visibilityMode = mode;
    await this.syncVisibility();
  }

  openMainWindow(): void {
    this.deps.focusMainWindow();
    const mainWindow = this.deps.getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('navigate', '/');
    }
    void this.syncVisibility();
  }

  broadcastVisualState(state: BubbleVisualState): void {
    const win = this.bubbleWindow;
    if (!win || win.isDestroyed()) return;
    win.webContents.send('bubble:visual-state', { state });
  }

  getWindow(): BrowserWindow | null {
    return this.bubbleWindow && !this.bubbleWindow.isDestroyed() ? this.bubbleWindow : null;
  }

  private subscribeToVisualState(): void {
    const controller = this.deps.getStateController();
    if (!controller) return;
    this.stateUnsubscribe?.();
    this.stateUnsubscribe = controller.subscribe((state) => {
      this.broadcastVisualState(state);
    });
  }

  private attachMainWindowListeners(): void {
    if (this.mainWindowListenersAttached) return;
    const mainWindow = this.deps.getMainWindow();
    if (!mainWindow || mainWindow.isDestroyed()) return;

    const sync = () => {
      void this.syncVisibility();
    };

    mainWindow.on('minimize', sync);
    mainWindow.on('hide', sync);
    mainWindow.on('show', sync);
    mainWindow.on('restore', sync);
    this.mainWindowListenersAttached = true;
  }

  private shouldShowBubble(): boolean {
    if (!isBubbleEnabledInCurrentProcess()) return false;
    if (this.visibilityMode === 'never') return false;
    if (this.visibilityMode === 'always') return true;

    const mainWindow = this.deps.getMainWindow();
    if (!mainWindow || mainWindow.isDestroyed()) return true;
    return !mainWindow.isVisible() || mainWindow.isMinimized();
  }

  private async syncVisibility(): Promise<void> {
    if (this.isQuitting) return;

    if (!this.shouldShowBubble()) {
      this.hideBubble();
      return;
    }

    await this.ensureBubbleWindow();
    this.showBubble();
  }

  private async ensureBubbleWindow(): Promise<void> {
    if (this.bubbleWindow && !this.bubbleWindow.isDestroyed()) {
      return;
    }

    const isMac = process.platform === 'darwin';
    const position = await getBubblePosition();

    const win = new BrowserWindow({
      width: BUBBLE_COMPACT_WIDTH,
      height: BUBBLE_COMPACT_HEIGHT,
      x: position.x,
      y: position.y,
      frame: false,
      transparent: true,
      hasShadow: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      focusable: true,
      show: false,
      backgroundColor: '#00000000',
      ...(isMac ? { roundedCorners: false } : {}),
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        backgroundThrottling: true,
      },
    });

    if (isMac) {
      win.setAlwaysOnTop(true, 'floating');
      win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });
    }

    win.once('ready-to-show', () => {
      if (this.isQuitting || win.isDestroyed()) return;
      if (this.pendingShow || this.shouldShowBubble()) {
        this.presentBubbleWindow(win);
      }
    });

    attachBubbleInputHandlers(win, {
      isPointerOnSphere: (input) => {
        if (win.isDestroyed()) return false;
        const bounds = win.getBounds();
        return isPointInSphere(input, bounds.width, bounds.height);
      },
      onClick: () => this.openMainWindow(),
      onDragEnd: () => this.finalizeWindowPosition(win),
    });

    win.on('closed', () => {
      if (this.bubbleWindow === win) {
        this.bubbleWindow = null;
      }
    });

    const url = this.getBubbleLoadUrl();
    await win.loadURL(url);

    this.bubbleWindow = win;

    const controller = this.deps.getStateController();
    if (controller) {
      this.broadcastVisualState(controller.getState());
    }

    if (!win.isDestroyed() && this.shouldShowBubble() && !win.isVisible()) {
      this.presentBubbleWindow(win);
    }
  }

  private getBubbleLoadUrl(): string {
    const shouldSkipSetupForE2E = process.env.SMARTX_E2E_SKIP_SETUP === '1';
    if (process.env.VITE_DEV_SERVER_URL) {
      const rendererUrl = new URL(process.env.VITE_DEV_SERVER_URL);
      rendererUrl.hash = '#/bubble';
      if (shouldSkipSetupForE2E) {
        rendererUrl.searchParams.set('e2eSkipSetup', '1');
      }
      return rendererUrl.toString();
    }
    const filePath = join(__dirname, '../../dist/index.html');
    const query = shouldSkipSetupForE2E ? '?e2eSkipSetup=1' : '';
    return `file://${filePath}${query}#/bubble`;
  }

  private showBubble(): void {
    const win = this.bubbleWindow;
    if (!win || win.isDestroyed()) return;

    this.pendingShow = true;
    if (win.isVisible()) {
      this.pendingShow = false;
      return;
    }

    if (win.webContents.isLoading()) {
      return;
    }

    this.presentBubbleWindow(win);
  }

  private presentBubbleWindow(win: BrowserWindow): void {
    if (win.isDestroyed()) return;

    this.pendingShow = false;
    if (process.platform === 'darwin') {
      win.setAlwaysOnTop(true, 'floating');
      win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });
    }

    if (!win.isVisible()) {
      if (process.platform === 'darwin') {
        win.show();
      } else {
        win.showInactive();
      }
    }
  }

  private hideBubble(): void {
    this.pendingShow = false;
    const win = this.bubbleWindow;
    if (!win || win.isDestroyed()) return;
    if (win.isVisible()) {
      win.hide();
    }
  }

  private finalizeWindowPosition(win: BrowserWindow): void {
    if (win.isDestroyed()) return;

    const bounds = win.getBounds();
    const snapped = snapBubbleBounds({
      x: bounds.x,
      y: bounds.y,
      width: BUBBLE_COMPACT_WIDTH,
      height: BUBBLE_COMPACT_HEIGHT,
    });

    win.setBounds({
      x: snapped.x,
      y: snapped.y,
      width: BUBBLE_COMPACT_WIDTH,
      height: BUBBLE_COMPACT_HEIGHT,
    });

    void saveBubblePosition(snapped);
  }
}

let bubbleWindowManager: BubbleWindowManager | null = null;
let bubbleStateController: BubbleStateController | null = null;

export function getBubbleWindowManager(): BubbleWindowManager | null {
  return bubbleWindowManager;
}

export function getBubbleStateController(): BubbleStateController | null {
  return bubbleStateController;
}

export function initBubbleSystem(deps: {
  gatewayManager: import('../gateway/manager').GatewayManager;
  getMainWindow: () => BrowserWindowType | null;
  focusMainWindow: () => void;
}): BubbleWindowManager | null {
  if (!isBubbleEnabledInCurrentProcess()) {
    return null;
  }

  bubbleStateController = new BubbleStateController(deps.gatewayManager);
  bubbleStateController.start();

  bubbleWindowManager = new BubbleWindowManager({
    getMainWindow: deps.getMainWindow,
    focusMainWindow: deps.focusMainWindow,
    getStateController: () => bubbleStateController,
  });

  void bubbleWindowManager.init();
  return bubbleWindowManager;
}

export function teardownBubbleSystem(): void {
  bubbleWindowManager?.setQuitting();
  bubbleWindowManager?.destroy();
  bubbleWindowManager = null;
  bubbleStateController?.stop();
  bubbleStateController = null;
}
