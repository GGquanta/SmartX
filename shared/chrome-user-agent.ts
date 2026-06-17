const DEFAULT_CHROME_VERSION = '134.0.0.0';

/** Platform token embedded in Chrome-style User-Agent strings. */
export function getPlatformSlugForUserAgent(platform?: string): string {
  switch (platform) {
    case 'darwin':
      return 'Macintosh; Intel Mac OS X 10_15_7';
    case 'linux':
      return 'X11; Linux x86_64';
    case 'win32':
      return 'Windows NT 10.0; Win64; x64';
    default:
      return 'Windows NT 10.0; Win64; x64';
  }
}

export function inferPlatformSlugFromNavigatorUserAgent(userAgent: string): string {
  if (/Macintosh|Mac OS X/i.test(userAgent)) {
    return getPlatformSlugForUserAgent('darwin');
  }
  if (/Linux/i.test(userAgent)) {
    return getPlatformSlugForUserAgent('linux');
  }
  if (/Windows/i.test(userAgent)) {
    return getPlatformSlugForUserAgent('win32');
  }
  return getPlatformSlugForUserAgent('win32');
}

export function inferChromeVersionFromUserAgent(userAgent: string): string {
  const match = userAgent.match(/Chrome\/([\d.]+)/);
  return match?.[1] ?? DEFAULT_CHROME_VERSION;
}

export type BuildChromeUserAgentOptions = {
  chromeVersion?: string;
  platformSlug?: string;
};

function readProcessChromeVersion(): string | undefined {
  try {
    return typeof process !== 'undefined' ? process.versions?.chrome : undefined;
  } catch {
    return undefined;
  }
}

function readProcessPlatform(): string | undefined {
  try {
    return typeof process !== 'undefined' ? process.platform : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Build a standard Chrome User-Agent without Electron or app-specific tokens.
 * Used for app.userAgentFallback and embedded webviews so subframe requests
 * (e.g. Cloudflare Turnstile) do not leak "Electron/" in HTTP headers.
 */
export function buildChromeUserAgent(options: BuildChromeUserAgentOptions = {}): string {
  const chromeVersion = options.chromeVersion ?? readProcessChromeVersion() ?? DEFAULT_CHROME_VERSION;
  const platformSlug = options.platformSlug ?? getPlatformSlugForUserAgent(readProcessPlatform());

  return `Mozilla/5.0 (${platformSlug}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
}

/** Renderer helper when process.versions is unavailable. */
export function buildChromeUserAgentFromNavigator(userAgent: string): string {
  return buildChromeUserAgent({
    chromeVersion: inferChromeVersionFromUserAgent(userAgent),
    platformSlug: inferPlatformSlugFromNavigatorUserAgent(userAgent),
  });
}
