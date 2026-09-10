import { describe, expect, it, vi } from 'vitest';
import type { Session } from 'electron';
import {
  companyKnowledgeFilterUrls,
  formatCookieHeader,
  isCompanyKnowledgeUrl,
  resolveCompanyKnowledgeUrl,
} from '@shared/company-knowledge';
import { installCompanyKnowledgeCookieShare } from '@electron/main/company-knowledge-cookies';
import { fetchCompanyKnowledgeResource } from '@electron/utils/company-knowledge-resource';

describe('company knowledge cookie sharing', () => {
  it('resolves the embed origin used for chat image requests', () => {
    expect(resolveCompanyKnowledgeUrl()).toBe('http://localhost:5001/');
    expect(resolveCompanyKnowledgeUrl(' https://ck.qubitlab.cc/ ')).toBe('https://ck.qubitlab.cc/');
    expect(companyKnowledgeFilterUrls('https://ck.qubitlab.cc/')).toEqual(['https://ck.qubitlab.cc/*']);
    expect(isCompanyKnowledgeUrl(
      'https://ck.qubitlab.cc/v1/documents/abc/derived-object?path=media%2F9d1f22bf.png',
      'https://ck.qubitlab.cc/',
    )).toBe(true);
    expect(isCompanyKnowledgeUrl('https://evil.example/img.png', 'https://ck.qubitlab.cc/')).toBe(false);
  });

  it('attaches session cookies to outgoing knowledge-base requests', async () => {
    const onBeforeSendHeaders = vi.fn();
    const onHeadersReceived = vi.fn();
    const getCookies = vi.fn().mockResolvedValue([{ name: 'sid', value: 'abc' }]);
    const session = {
      cookies: { get: getCookies },
      webRequest: { onBeforeSendHeaders, onHeadersReceived },
    } as unknown as Session;

    installCompanyKnowledgeCookieShare(session, { embedUrl: 'https://ck.qubitlab.cc/' });

    expect(onBeforeSendHeaders).toHaveBeenCalledWith(
      { urls: ['https://ck.qubitlab.cc/*'] },
      expect.any(Function),
    );
    expect(onHeadersReceived).not.toHaveBeenCalled();

    const listener = onBeforeSendHeaders.mock.calls[0]?.[1] as (
      details: { url: string; requestHeaders: Record<string, string> },
      callback: (response: { requestHeaders: Record<string, string> }) => void,
    ) => void;
    const callback = vi.fn();
    listener({
      url: 'https://ck.qubitlab.cc/v1/documents/abc/derived-object?path=media%2Fx.png',
      requestHeaders: { Accept: 'image/png' },
    }, callback);

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledWith({
        requestHeaders: {
          Accept: 'image/png',
          Cookie: 'sid=abc',
        },
      });
    });
    expect(formatCookieHeader([{ name: 'sid', value: 'abc' }, { name: 'csrf', value: '1' }]))
      .toBe('sid=abc; csrf=1');
  });

  it('fetches knowledge resources through the isolated session cookie jar', async () => {
    const png = Buffer.from('png-bytes');
    await expect(fetchCompanyKnowledgeResource({
      url: 'file:///etc/passwd',
      embedUrl: 'https://ck.qubitlab.cc/',
      fetch: vi.fn(),
    })).rejects.toThrow('not an allowed company-knowledge resource');

    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'image/png' },
      arrayBuffer: async () => png,
    });

    await expect(fetchCompanyKnowledgeResource({
      url: 'https://ck.qubitlab.cc/v1/documents/abc/derived-object?path=media%2Fx.png',
      embedUrl: 'https://ck.qubitlab.cc/',
      fetch,
    })).resolves.toEqual({
      contentType: 'image/png',
      base64: png.toString('base64'),
    });
  });
});
