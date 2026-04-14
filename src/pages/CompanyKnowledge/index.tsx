/**
 * Company knowledge base page — embeds configurable internal web UI.
 */
import { useTranslation } from 'react-i18next';

const DEFAULT_COMPANY_KNOWLEDGE_URL = 'http://localhost:5001/';

function resolveCompanyKnowledgeUrl(): string {
  const fromEnv = import.meta.env.VITE_COMPANY_KNOWLEDGE_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim();
  }
  return DEFAULT_COMPANY_KNOWLEDGE_URL;
}

export function CompanyKnowledge() {
  const { t } = useTranslation('common');
  const embedUrl = resolveCompanyKnowledgeUrl();

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
          <webview
            data-testid="company-knowledge-webview"
            className="w-full flex-1 min-h-0"
            src={embedUrl}
            partition="persist:clawx-company-knowledge"
          />
        </div>
      </div>
    </div>
  );
}
