/**
 * Bubble visual state aggregation (gateway + foreground chat run)
 */
import type { GatewayManager } from '../gateway/manager';
import type { BubbleVisualState } from '@shared/host-api/contract';
import type { GatewayStatus } from '@shared/types/gateway';

function isGatewayDisconnected(status: GatewayStatus, wsConnected: boolean): boolean {
  if (!wsConnected) return true;
  return status.state === 'stopped'
    || status.state === 'error'
    || status.state === 'reconnecting';
}

export function resolveBubbleVisualState(
  status: GatewayStatus,
  wsConnected: boolean,
  foregroundRunActive: boolean,
): BubbleVisualState {
  if (isGatewayDisconnected(status, wsConnected)) {
    return 'disconnected';
  }
  if (foregroundRunActive) {
    return 'working';
  }
  return 'idle';
}

export type BubbleVisualStateListener = (state: BubbleVisualState) => void;

export class BubbleStateController {
  private foregroundRunActive = false;
  private listeners = new Set<BubbleVisualStateListener>();
  private currentState: BubbleVisualState = 'idle';
  private gatewayUnsubscribe: (() => void) | null = null;

  constructor(private readonly gatewayManager: GatewayManager) {}

  start(): void {
    const handler = () => this.emitIfChanged();
    this.gatewayManager.on('status', handler);
    this.gatewayUnsubscribe = () => {
      this.gatewayManager.off('status', handler);
    };
    this.emitIfChanged();
  }

  stop(): void {
    this.gatewayUnsubscribe?.();
    this.gatewayUnsubscribe = null;
    this.listeners.clear();
  }

  setForegroundRunActive(active: boolean): void {
    if (this.foregroundRunActive === active) return;
    this.foregroundRunActive = active;
    this.emitIfChanged();
  }

  subscribe(listener: BubbleVisualStateListener): () => void {
    this.listeners.add(listener);
    listener(this.currentState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): BubbleVisualState {
    return this.currentState;
  }

  private emitIfChanged(): void {
    const next = resolveBubbleVisualState(
      this.gatewayManager.getStatus(),
      this.gatewayManager.isConnected(),
      this.foregroundRunActive,
    );
    if (next === this.currentState) return;
    this.currentState = next;
    for (const listener of this.listeners) {
      listener(next);
    }
  }
}
