import { describe, expect, it, vi } from 'vitest';
import type { Session } from 'electron';
import {
  buildRendererContentSecurityPolicy,
  getRendererContentSecurityPolicyFilterUrls,
} from '@shared/security/renderer-csp';
import { installRendererContentSecurityPolicy } from '@electron/main/renderer-csp';

describe('renderer content security policy', () => {
  it('does not enable unsafe-eval in development or production', () => {
    const development = buildRendererContentSecurityPolicy({ isDev: true });
    const production = buildRendererContentSecurityPolicy({ isDev: false });

    expect(development).not.toContain('unsafe-eval');
    expect(production).not.toContain('unsafe-eval');
    expect(development).toContain("script-src 'self' blob: 'unsafe-inline'");
    expect(production).toMatch(/script-src 'self' blob:(;|$)/);
    expect(production).not.toMatch(/script-src[^;]*unsafe-inline/);
  });

  it('scopes header injection to the renderer origin', () => {
    expect(getRendererContentSecurityPolicyFilterUrls()).toEqual(['file://*/*']);
    expect(getRendererContentSecurityPolicyFilterUrls('http://localhost:5173/')).toEqual([
      'http://localhost:5173/*',
    ]);
  });

  it('applies the policy only to the renderer main frame', () => {
    const onHeadersReceived = vi.fn();
    const session = {
      webRequest: { onHeadersReceived },
    } as unknown as Session;

    installRendererContentSecurityPolicy(session, {
      devServerUrl: 'http://localhost:5173/',
    });

    expect(onHeadersReceived).toHaveBeenCalledWith(
      { urls: ['http://localhost:5173/*'] },
      expect.any(Function),
    );

    const listener = onHeadersReceived.mock.calls[0]?.[1] as (
      details: { resourceType: string; responseHeaders?: Record<string, string[]> },
      callback: (response: { responseHeaders?: Record<string, string[]> }) => void,
    ) => void;
    const callback = vi.fn();

    listener({ resourceType: 'script', responseHeaders: { 'X-Test': ['1'] } }, callback);
    expect(callback).toHaveBeenCalledWith({ responseHeaders: { 'X-Test': ['1'] } });

    listener({ resourceType: 'mainFrame', responseHeaders: { 'X-Test': ['1'] } }, callback);
    expect(callback).toHaveBeenCalledWith({
      responseHeaders: {
        'X-Test': ['1'],
        'Content-Security-Policy': [buildRendererContentSecurityPolicy({ isDev: true })],
      },
    });
  });
});
