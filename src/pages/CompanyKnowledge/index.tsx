/**
 * Company knowledge base page — embeds configurable internal web UI.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { hostApi } from '@/lib/host-api';
import { buildChromeUserAgentFromNavigator } from '@shared/chrome-user-agent';
import {
  COMPANY_KNOWLEDGE_WEBVIEW_PARTITION,
  COMPANY_KNOWLEDGE_WEBVIEW_ZOOM_FACTOR,
  resolveCompanyKnowledgeUrl,
} from '@shared/company-knowledge';

function embedCompanyKnowledgeUrl(): string {
  return resolveCompanyKnowledgeUrl(import.meta.env.VITE_COMPANY_KNOWLEDGE_URL);
}

function buildCompanyKnowledgeWebviewUserAgent(): string {
  const navigatorUa = typeof navigator !== 'undefined' ? navigator.userAgent.trim() : '';
  return buildChromeUserAgentFromNavigator(navigatorUa);
}

type WebviewPrep = {
  userAgent: string;
  preloadPath: string;
};

type WebviewIpcMessageEvent = Event & { channel: string; args: unknown[] };

type CompanyKnowledgeWebviewElement = HTMLElement & {
  setZoomFactor: (factor: number) => void;
  addEventListener(
    type: 'ipc-message' | 'dom-ready' | 'did-finish-load',
    listener: (ev: WebviewIpcMessageEvent | Event) => void,
  ): void;
  removeEventListener(
    type: 'ipc-message' | 'dom-ready' | 'did-finish-load',
    listener: (ev: WebviewIpcMessageEvent | Event) => void,
  ): void;
};

function applyCompanyKnowledgeWebviewZoom(wv: CompanyKnowledgeWebviewElement): void {
  try {
    wv.setZoomFactor(COMPANY_KNOWLEDGE_WEBVIEW_ZOOM_FACTOR);
  } catch {
    // Guest is not attached yet; dom-ready / did-finish-load retry.
  }
}

export function CompanyKnowledge() {
  const { t } = useTranslation('common');
  const embedUrl = embedCompanyKnowledgeUrl();
  const webviewRef = useRef<CompanyKnowledgeWebviewElement | null>(null);
  const [webviewPrep, setWebviewPrep] = useState<WebviewPrep | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const preloadPath = await hostApi.app.getCompanyKnowledgeWebviewPreloadPath();
        if (!cancelled) {
          setWebviewPrep({
            userAgent: buildCompanyKnowledgeWebviewUserAgent(),
            preloadPath,
          });
        }
      } catch {
        if (!cancelled) {
          setWebviewPrep(null);
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

    wv.setAttribute(
      'webpreferences',
      `contextIsolation=yes,nodeIntegration=no,sandbox=no,zoomFactor=${COMPANY_KNOWLEDGE_WEBVIEW_ZOOM_FACTOR}`,
    );
    wv.setAttribute('preload', webviewPrep.preloadPath);
    wv.setAttribute('useragent', webviewPrep.userAgent);
    wv.setAttribute('src', embedUrl);
    applyCompanyKnowledgeWebviewZoom(wv);

    const onIpcMessage = (event: Event) => {
      const ipcEvent = event as WebviewIpcMessageEvent;
      if (ipcEvent.channel !== 'company-knowledge:bind-result') {
        return;
      }
      const [raw] = ipcEvent.args;
      const result = raw as { success?: boolean; error?: string } | undefined;
      if (result?.success) {
        toast.success(t('companyKnowledgePage.bindSaved'));
      } else {
        toast.error(t('companyKnowledgePage.bindFailed', { error: result?.error || 'unknown' }));
      }
    };
    const onGuestReady = () => {
      applyCompanyKnowledgeWebviewZoom(wv);
    };

    wv.addEventListener('ipc-message', onIpcMessage);
    wv.addEventListener('dom-ready', onGuestReady);
    wv.addEventListener('did-finish-load', onGuestReady);
    return () => {
      wv.removeEventListener('ipc-message', onIpcMessage);
      wv.removeEventListener('dom-ready', onGuestReady);
      wv.removeEventListener('did-finish-load', onGuestReady);
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
              partition={COMPANY_KNOWLEDGE_WEBVIEW_PARTITION}
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
