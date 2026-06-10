/**
 * Company knowledge base page — embeds configurable internal web UI.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { hostApi } from '@/lib/host-api';

const DEFAULT_COMPANY_KNOWLEDGE_URL = 'http://localhost:5001/';

function resolveCompanyKnowledgeUrl(): string {
  const fromEnv = import.meta.env.VITE_COMPANY_KNOWLEDGE_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim();
  }
  return DEFAULT_COMPANY_KNOWLEDGE_URL;
}

function buildCompanyKnowledgeWebviewUserAgent(appVersion: string): string {
  const base = typeof navigator !== 'undefined' ? navigator.userAgent.trim() : '';
  const smartx = `SmartX/${appVersion}`;
  return base ? `${base} ${smartx}` : smartx;
}

type WebviewPrep = {
  userAgent: string;
  preloadPath: string;
};

type WebviewIpcMessageEvent = Event & { channel: string; args: unknown[] };

type CompanyKnowledgeWebviewElement = HTMLElement & {
  addEventListener(
    type: 'ipc-message',
    listener: (ev: WebviewIpcMessageEvent) => void,
  ): void;
  removeEventListener(
    type: 'ipc-message',
    listener: (ev: WebviewIpcMessageEvent) => void,
  ): void;
};

export function CompanyKnowledge() {
  const { t } = useTranslation('common');
  const embedUrl = resolveCompanyKnowledgeUrl();
  const webviewRef = useRef<CompanyKnowledgeWebviewElement | null>(null);
  const [webviewPrep, setWebviewPrep] = useState<WebviewPrep | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [version, preloadPath] = await Promise.all([
          hostApi.app.version(),
          hostApi.app.getCompanyKnowledgeWebviewPreloadPath(),
        ]);
        if (!cancelled) {
          setWebviewPrep({
            userAgent: buildCompanyKnowledgeWebviewUserAgent(version),
            preloadPath,
          });
        }
      } catch {
        if (cancelled) return;
        try {
          const preloadPath = await hostApi.app.getCompanyKnowledgeWebviewPreloadPath();
          if (!cancelled) {
            setWebviewPrep({
              userAgent: buildCompanyKnowledgeWebviewUserAgent('0.0.0'),
              preloadPath,
            });
          }
        } catch {
          if (!cancelled) {
            setWebviewPrep(null);
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Apply preload / UA / src on the native <webview> in tree order. React props can race
  // navigation vs preload; attribute order matters for Electron guest initialization.
  useLayoutEffect(() => {
    const wv = webviewRef.current;
    if (!wv || !webviewPrep) {
      return undefined;
    }

    wv.setAttribute('webpreferences', 'contextIsolation=yes,nodeIntegration=no,sandbox=no');
    wv.setAttribute('preload', webviewPrep.preloadPath);
    wv.setAttribute('useragent', webviewPrep.userAgent);
    wv.setAttribute('src', embedUrl);

    const onIpcMessage = (event: WebviewIpcMessageEvent) => {
      if (event.channel !== 'company-knowledge:bind-result') {
        return;
      }
      const [raw] = event.args;
      const result = raw as { success?: boolean; error?: string } | undefined;
      if (result?.success) {
        toast.success(t('companyKnowledgePage.bindSaved'));
      } else {
        toast.error(t('companyKnowledgePage.bindFailed', { error: result?.error || 'unknown' }));
      }
    };

    wv.addEventListener('ipc-message', onIpcMessage);
    return () => {
      wv.removeEventListener('ipc-message', onIpcMessage);
    };
  }, [webviewPrep, embedUrl, t]);

  return (
    <div
      data-testid="company-knowledge-page"
      className="flex flex-col -m-6 dark:bg-background h-[calc(100vh-2.5rem)] overflow-hidden"
    >
      <div className="w-full max-w-5xl mx-auto flex flex-col h-full min-h-0 p-10 pt-16">
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-12 shrink-0 gap-4">
          <div>
            <h1
              data-testid="company-knowledge-page-title"
              className="text-4xl md:text-5xl font-serif text-foreground mb-3 font-normal tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('sidebar.companyKnowledge')}
            </h1>
            <p className="text-[17px] text-foreground/70 font-medium">
              {t('companyKnowledgePage.description')}
            </p>
          </div>
        </div>
        <div className="flex-1 min-h-0 flex flex-col rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] overflow-hidden">
          {webviewPrep ? (
            <webview
              ref={webviewRef}
              data-testid="company-knowledge-webview"
              className="w-full flex-1 min-h-0"
            />
          ) : (
            <div className="w-full flex-1 min-h-0" aria-busy="true" />
          )}
        </div>
      </div>
    </div>
  );
}
