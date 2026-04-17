/**
 * Research tools page — literature, experiments, analysis helpers (placeholder).
 */
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Atom, Library } from 'lucide-react';
import { invokeIpc } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const QUA_FU_SQC_HOME = 'https://quafu-sqc.baqis.ac.cn/home';

export function ResearchTools() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  const handleOpenQuafu = () => {
    void invokeIpc('shell:openExternal', QUA_FU_SQC_HOME);
  };

  const handleVisitKnowledge = () => {
    void navigate('/company-knowledge');
  };

  const ctaShell = (
    gradientBorder: string,
    darkGradientBorder: string,
    shadowClass: string,
    darkShadowClass: string,
  ) =>
    cn(
      'rounded-full p-[2px]',
      gradientBorder,
      darkGradientBorder,
      shadowClass,
      darkShadowClass,
    );

  const ctaInner = (
    innerGradient: string,
    darkInnerGradient: string,
    hoverShadow: string,
  ) =>
    cn(
      'relative block w-full rounded-full px-8 py-3.5 md:px-10 md:py-4',
      'text-[15px] md:text-base font-semibold tracking-tight',
      'text-white',
      'bg-gradient-to-br',
      innerGradient,
      darkInnerGradient,
      'ring-1 ring-inset ring-white/25',
      'shadow-inner shadow-white/10',
      'transition-all duration-200',
      'hover:brightness-110 hover:shadow-lg',
      hoverShadow,
      'active:scale-[0.98]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    );

  return (
    <div
      data-testid="research-tools-page"
      className="flex flex-col -m-6 dark:bg-background h-[calc(100vh-2.5rem)] overflow-hidden"
    >
      <div className="w-full max-w-5xl mx-auto flex flex-col h-full min-h-0 p-10 pt-16">
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-10 shrink-0 gap-4">
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

        <div className="flex-1 flex items-stretch justify-center min-h-0 px-2 pb-10">
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-stretch">
            {/* 量子计算云平台 */}
            <div
              data-testid="research-tools-quantum-section"
              className={cn(
                'rounded-3xl p-[2px] min-h-[280px] flex flex-col',
                'bg-gradient-to-br from-cyan-300 via-sky-400 to-blue-600',
                'dark:from-cyan-400 dark:via-sky-500 dark:to-blue-600',
                'shadow-[0_12px_40px_-12px_rgba(14,165,233,0.45)]',
                'dark:shadow-[0_14px_48px_-14px_rgba(56,189,248,0.38)]',
              )}
            >
              <div
                className={cn(
                  'flex flex-col flex-1 rounded-[22px] overflow-hidden',
                  'bg-gradient-to-br from-sky-100/95 via-cyan-50/90 to-blue-100/95',
                  'dark:from-sky-950/55 dark:via-slate-900/75 dark:to-blue-950/60',
                  'border border-white/40 dark:border-white/10',
                  'px-6 py-8 md:px-8 md:py-10',
                )}
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className={cn(
                      'mb-8 md:mb-10 flex h-[5.25rem] w-[5.25rem] md:h-24 md:w-24 items-center justify-center rounded-2xl',
                      'bg-white/55 shadow-inner ring-1 ring-sky-200/80 dark:bg-white/[0.07] dark:ring-sky-400/25',
                    )}
                    aria-hidden
                  >
                    <Atom
                      className={cn(
                        'h-[3.25rem] w-[3.25rem] md:h-14 md:w-14',
                        'text-sky-600 dark:text-sky-300',
                        'drop-shadow-[0_2px_8px_rgba(14,165,233,0.35)]',
                      )}
                      strokeWidth={1.35}
                    />
                  </div>
                  <h2
                    className={cn(
                      'text-xl md:text-2xl font-semibold tracking-tight',
                      'text-sky-950 dark:text-sky-100',
                    )}
                  >
                    {t('researchToolsPage.quantumCloudTitle')}
                  </h2>
                </div>
                <div className="mt-auto pt-10">
                  <div
                    className={ctaShell(
                      'bg-gradient-to-r from-sky-300 via-sky-500 to-blue-600',
                      'dark:from-sky-400 dark:via-sky-500 dark:to-blue-600',
                      'shadow-[0_8px_32px_-8px_rgba(14,165,233,0.45)]',
                      'dark:shadow-[0_8px_36px_-10px_rgba(56,189,248,0.35)]',
                    )}
                  >
                    <button
                      data-testid="research-tools-login-cloud-button"
                      type="button"
                      onClick={handleOpenQuafu}
                      className={ctaInner(
                        'from-sky-500 via-sky-600 to-blue-700',
                        'dark:from-sky-500 dark:via-blue-600 dark:to-blue-800',
                        'hover:shadow-sky-500/25',
                      )}
                    >
                      {t('researchToolsPage.loginCloudButton')}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 科研文献知识库 */}
            <div
              data-testid="research-tools-literature-section"
              className={cn(
                'rounded-3xl p-[2px] min-h-[280px] flex flex-col',
                'bg-gradient-to-br from-violet-400 via-fuchsia-400 to-rose-500',
                'dark:from-violet-500 dark:via-fuchsia-500 dark:to-rose-600',
                'shadow-[0_12px_40px_-12px_rgba(168,85,247,0.42)]',
                'dark:shadow-[0_14px_48px_-14px_rgba(217,70,239,0.35)]',
              )}
            >
              <div
                className={cn(
                  'flex flex-col flex-1 rounded-[22px] overflow-hidden',
                  'bg-gradient-to-br from-violet-100/95 via-fuchsia-50/90 to-rose-100/95',
                  'dark:from-violet-950/50 dark:via-slate-900/75 dark:to-fuchsia-950/55',
                  'border border-white/40 dark:border-white/10',
                  'px-6 py-8 md:px-8 md:py-10',
                )}
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className={cn(
                      'mb-8 md:mb-10 flex h-[5.25rem] w-[5.25rem] md:h-24 md:w-24 items-center justify-center rounded-2xl',
                      'bg-white/55 shadow-inner ring-1 ring-violet-200/80 dark:bg-white/[0.07] dark:ring-fuchsia-400/25',
                    )}
                    aria-hidden
                  >
                    <Library
                      className={cn(
                        'h-[3.25rem] w-[3.25rem] md:h-14 md:w-14',
                        'text-violet-600 dark:text-violet-300',
                        'drop-shadow-[0_2px_8px_rgba(139,92,246,0.35)]',
                      )}
                      strokeWidth={1.35}
                    />
                  </div>
                  <h2
                    className={cn(
                      'text-xl md:text-2xl font-semibold tracking-tight',
                      'text-violet-950 dark:text-violet-100',
                    )}
                  >
                    {t('researchToolsPage.literatureKnowledgeTitle')}
                  </h2>
                </div>
                <div className="mt-auto pt-10">
                  <div
                    className={ctaShell(
                      'bg-gradient-to-r from-violet-400 via-fuchsia-500 to-rose-600',
                      'dark:from-violet-500 dark:via-fuchsia-500 dark:to-rose-600',
                      'shadow-[0_8px_32px_-8px_rgba(168,85,247,0.4)]',
                      'dark:shadow-[0_8px_36px_-10px_rgba(217,70,239,0.32)]',
                    )}
                  >
                    <button
                      data-testid="research-tools-visit-knowledge-button"
                      type="button"
                      onClick={handleVisitKnowledge}
                      className={ctaInner(
                        'from-violet-500 via-fuchsia-600 to-rose-700',
                        'dark:from-violet-600 dark:via-fuchsia-600 dark:to-rose-800',
                        'hover:shadow-fuchsia-500/30',
                      )}
                    >
                      {t('researchToolsPage.visitKnowledgeButton')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
