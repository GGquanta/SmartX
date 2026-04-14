/**
 * Research tools page — literature, experiments, analysis helpers (placeholder).
 */
import { useTranslation } from 'react-i18next';
import { invokeIpc } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const QUA_FU_SQC_HOME = 'https://quafu-sqc.baqis.ac.cn/home';

export function ResearchTools() {
  const { t } = useTranslation('common');

  const handleOpenQuafu = () => {
    void invokeIpc('shell:openExternal', QUA_FU_SQC_HOME);
  };

  return (
    <div
      data-testid="research-tools-page"
      className="flex flex-col -m-6 dark:bg-background h-[calc(100vh-2.5rem)] overflow-hidden"
    >
      <div className="w-full max-w-5xl mx-auto flex flex-col h-full min-h-0 p-10 pt-16">
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-12 shrink-0 gap-4">
          <div>
            <h1
              data-testid="research-tools-page-title"
              className="text-4xl md:text-5xl font-serif text-foreground mb-3 font-normal tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('sidebar.researchTools')}
            </h1>
            <p className="text-[17px] text-foreground/70 font-medium">
              {t('researchToolsPage.description')}
            </p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center min-h-0 px-2 pb-10">
          <div
            className={cn(
              'rounded-full p-[2px]',
              'bg-gradient-to-r from-sky-300 via-sky-500 to-blue-600',
              'dark:from-sky-400 dark:via-sky-500 dark:to-blue-600',
              'shadow-[0_8px_32px_-8px_rgba(14,165,233,0.45)]',
              'dark:shadow-[0_8px_36px_-10px_rgba(56,189,248,0.35)]',
            )}
          >
            <button
              data-testid="research-tools-quafu-login-button"
              type="button"
              onClick={handleOpenQuafu}
              className={cn(
                'relative block w-full min-w-[min(100%,20rem)] rounded-full px-10 py-4 md:px-14 md:py-5',
                'text-[15px] md:text-lg font-semibold tracking-tight',
                'text-white',
                'bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700',
                'dark:from-sky-500 dark:via-blue-600 dark:to-blue-800',
                'ring-1 ring-inset ring-white/25',
                'shadow-inner shadow-white/10',
                'transition-all duration-200',
                'hover:brightness-110 hover:shadow-lg hover:shadow-sky-500/25',
                'active:scale-[0.98]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              )}
            >
              {t('researchToolsPage.quafuLoginButton')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
