import type { Session } from 'electron';
import {
  companyKnowledgeFilterUrls,
  formatCookieHeader,
} from '../../shared/company-knowledge';

/**
 * Main-process session.fetch has no document initiator, so Chromium may omit
 * SameSite=Lax/Strict cookies. Attach the partition cookie jar explicitly.
 */
export function installCompanyKnowledgeCookieShare(
  targetSession: Session,
  options: { embedUrl: string },
): void {
  const urls = companyKnowledgeFilterUrls(options.embedUrl);
  if (urls.length === 0) {
    return;
  }

  targetSession.webRequest.onBeforeSendHeaders({ urls }, (details, callback) => {
    void targetSession.cookies
      .get({ url: details.url })
      .then((cookies) => {
        if (cookies.length === 0) {
          callback({ requestHeaders: details.requestHeaders });
          return;
        }
        callback({
          requestHeaders: {
            ...details.requestHeaders,
            Cookie: formatCookieHeader(cookies),
          },
        });
      })
      .catch(() => {
        callback({ requestHeaders: details.requestHeaders });
      });
  });
}
