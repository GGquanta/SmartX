import type { Session } from 'electron';
import {
  buildRendererContentSecurityPolicy,
  getRendererContentSecurityPolicyFilterUrls,
} from '@shared/security/renderer-csp';

export function installRendererContentSecurityPolicy(
  targetSession: Session,
  options: { devServerUrl?: string } = {},
): void {
  const isDev = Boolean(options.devServerUrl);
  const policy = buildRendererContentSecurityPolicy({ isDev });
  const urls = getRendererContentSecurityPolicyFilterUrls(options.devServerUrl);

  targetSession.webRequest.onHeadersReceived({ urls }, (details, callback) => {
    if (details.resourceType !== 'mainFrame') {
      callback({ responseHeaders: details.responseHeaders });
      return;
    }

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [policy],
      },
    });
  });
}
