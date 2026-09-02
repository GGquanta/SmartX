import { describe, expect, it } from 'vitest';

import {
  buildChromeUserAgent,
  buildChromeUserAgentFromNavigator,
  getPlatformSlugForUserAgent,
  inferChromeVersionFromUserAgent,
  inferPlatformSlugFromNavigatorUserAgent,
} from '../../shared/chrome-user-agent';

describe('chrome-user-agent', () => {
  it('builds a Chrome UA without Electron tokens', () => {
    const ua = buildChromeUserAgent({
      chromeVersion: '140.0.0.0',
      platformSlug: getPlatformSlugForUserAgent('darwin'),
    });
    expect(ua).toBe(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    );
    expect(ua).not.toContain('Electron');
    expect(ua).not.toContain('SmartX');
  });

  it('infers platform slug from navigator UA', () => {
    expect(
      inferPlatformSlugFromNavigatorUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140.0.0.0 Electron/40.0.0 Safari/537.36',
      ),
    ).toBe(getPlatformSlugForUserAgent('darwin'));
    expect(
      inferPlatformSlugFromNavigatorUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0 Electron/40.0.0 Safari/537.36',
      ),
    ).toBe(getPlatformSlugForUserAgent('win32'));
  });

  it('infers chrome version from navigator UA', () => {
    expect(
      inferChromeVersionFromUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140.0.6998.89 Electron/40.0.0 Safari/537.36',
      ),
    ).toBe('140.0.6998.89');
  });

  it('buildChromeUserAgentFromNavigator strips Electron from the result', () => {
    const ua = buildChromeUserAgentFromNavigator(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140.0.6998.89 Electron/40.0.0 Safari/537.36 SmartX/0.4.10',
    );
    expect(ua).toContain('Chrome/140.0.6998.89');
    expect(ua).not.toContain('Electron');
    expect(ua).not.toContain('SmartX');
  });
});
