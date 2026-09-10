/** Isolated session for the Company Knowledge embedded <webview>. */
export const COMPANY_KNOWLEDGE_WEBVIEW_PARTITION = 'persist:company-knowledge' as const;

/** Guest zoom so the dense knowledge UI fits the default SmartX content pane. */
export const COMPANY_KNOWLEDGE_WEBVIEW_ZOOM_FACTOR = 0.75;

export const DEFAULT_COMPANY_KNOWLEDGE_URL = 'http://localhost:5001/';

export function resolveCompanyKnowledgeUrl(fromEnv?: string): string {
  const trimmed = fromEnv?.trim();
  return trimmed || DEFAULT_COMPANY_KNOWLEDGE_URL;
}

export function companyKnowledgeOrigin(embedUrl: string): string | null {
  try {
    const url = new URL(embedUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

export function companyKnowledgeFilterUrls(embedUrl: string): string[] {
  const origin = companyKnowledgeOrigin(embedUrl);
  return origin ? [`${origin}/*`] : [];
}

export function isCompanyKnowledgeUrl(candidate: string, embedUrl: string): boolean {
  const origin = companyKnowledgeOrigin(embedUrl);
  if (!origin) {
    return false;
  }
  try {
    return new URL(candidate).origin === origin;
  } catch {
    return false;
  }
}

export function formatCookieHeader(cookies: Array<{ name: string; value: string }>): string {
  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
}
