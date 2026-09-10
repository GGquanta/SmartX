import { describe, expect, it } from 'vitest';
import { isGatewayReady, isGatewayRestarting, isGatewayStopped } from '@/lib/gateway-status';
import type { GatewayStatus } from '@/types/gateway';

function status(overrides: Partial<GatewayStatus>): GatewayStatus {
  return { state: 'stopped', port: 18789, ...overrides };
}

describe('gateway status helpers', () => {
  it('treats a running gateway as ready unless explicitly marked otherwise', () => {
    expect(isGatewayReady(status({ state: 'running' }))).toBe(true);
    expect(isGatewayReady(status({ state: 'running', gatewayReady: true }))).toBe(true);
    expect(isGatewayReady(status({ state: 'running', gatewayReady: false }))).toBe(false);
    expect(isGatewayReady(status({ state: 'starting' }))).toBe(false);
    expect(isGatewayReady(status({ state: 'stopped' }))).toBe(false);
  });

  it('classifies restart and stopped states', () => {
    expect(isGatewayRestarting(status({ state: 'starting' }))).toBe(true);
    expect(isGatewayRestarting(status({ state: 'reconnecting' }))).toBe(true);
    expect(isGatewayRestarting(status({ state: 'running', gatewayReady: false }))).toBe(true);
    expect(isGatewayStopped(status({ state: 'stopped' }))).toBe(true);
    expect(isGatewayStopped(status({ state: 'error' }))).toBe(true);
  });
});
