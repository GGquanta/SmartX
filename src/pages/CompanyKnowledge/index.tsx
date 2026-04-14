/**
 * Company knowledge base page — internal docs & retrieval (placeholder).
 */
import { useTranslation } from 'react-i18next';
import { Library } from 'lucide-react';

export function CompanyKnowledge() {
  const { t } = useTranslation('common');

  return (
    <div
      data-testid="company-knowledge-page"
      className="flex flex-col -m-6 dark:bg-background h-[calc(100vh-2.5rem)] overflow-hidden"
    >
      <div className="w-full max-w-5xl mx-auto flex flex-col h-full p-10 pt-16">
        <div className="flex items-start gap-4 mb-8 shrink-0">
          <div className="rounded-xl bg-black/5 dark:bg-white/10 p-3">
            <Library className="h-8 w-8 text-foreground/80" strokeWidth={2} />
          </div>
          <div>
            <h1
              data-testid="company-knowledge-page-title"
              className="text-4xl md:text-5xl font-serif text-foreground mb-3 font-normal tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('sidebar.companyKnowledge')}
            </h1>
            <p className="text-[17px] text-foreground/70 font-medium max-w-2xl">
              {t('companyKnowledgePage.description')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
