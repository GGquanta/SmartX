/**
 * Research tools page — literature, experiments, analysis helpers (placeholder).
 */
import { useTranslation } from 'react-i18next';
import { Microscope } from 'lucide-react';

export function ResearchTools() {
  const { t } = useTranslation('common');

  return (
    <div
      data-testid="research-tools-page"
      className="flex flex-col -m-6 dark:bg-background h-[calc(100vh-2.5rem)] overflow-hidden"
    >
      <div className="w-full max-w-5xl mx-auto flex flex-col h-full p-10 pt-16">
        <div className="flex items-start gap-4 mb-8 shrink-0">
          <div className="rounded-xl bg-black/5 dark:bg-white/10 p-3">
            <Microscope className="h-8 w-8 text-foreground/80" strokeWidth={2} />
          </div>
          <div>
            <h1
              data-testid="research-tools-page-title"
              className="text-4xl md:text-5xl font-serif text-foreground mb-3 font-normal tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('sidebar.researchTools')}
            </h1>
            <p className="text-[17px] text-foreground/70 font-medium max-w-2xl">
              {t('researchToolsPage.description')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
