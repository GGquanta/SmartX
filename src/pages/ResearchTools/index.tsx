/**
 * Research tools page — literature, experiments, analysis helpers (placeholder).
 */
import { useEffect, useRef, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { hostApi } from '@/lib/host-api';
import { cn } from '@/lib/utils';

const QUA_FU_SQC_HOME = 'https://quafu-sqc.baqis.ac.cn/home';

type QuantumStrokeDashConfig = {
  dashOn: number;
  dashOff: number;
  lapCount: number;
  durationSec: number;
  reverse?: boolean;
};

function useQuantumStrokeDash(
  ref: RefObject<SVGElement | null>,
  { dashOn, dashOff, lapCount, durationSec, reverse = false }: QuantumStrokeDashConfig,
) {
  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return undefined;
    }

    const period = dashOn + dashOff;
    const travel = period * lapCount;
    node.setAttribute('stroke-dasharray', `${dashOn} ${dashOff}`);

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) {
      node.setAttribute('stroke-dashoffset', '0');
      return undefined;
    }

    let raf = 0;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - startedAt) % (durationSec * 1000);
      const progress = elapsed / (durationSec * 1000);
      const offset = (reverse ? 1 : -1) * progress * travel;
      node.setAttribute('stroke-dashoffset', String(offset));
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dashOn, dashOff, lapCount, durationSec, reverse]);
}

function QuantumHeroDecor() {
  const outerRingRef = useRef<SVGCircleElement>(null);
  const ellipseRingRef = useRef<SVGEllipseElement>(null);
  const midRingRef = useRef<SVGCircleElement>(null);

  useQuantumStrokeDash(outerRingRef, { dashOn: 6, dashOff: 10, lapCount: 70, durationSec: 48 });
  useQuantumStrokeDash(ellipseRingRef, { dashOn: 3, dashOff: 12, lapCount: 67, durationSec: 40, reverse: true });
  useQuantumStrokeDash(midRingRef, { dashOn: 4, dashOff: 8, lapCount: 63, durationSec: 32 });

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0a1628] to-[#041a2e]"
      />
      <div
        aria-hidden
        className="research-tools-quantum-aurora pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(56, 189, 248, 0.45) 0%, transparent 42%), radial-gradient(circle at 78% 68%, rgba(99, 102, 241, 0.4) 0%, transparent 38%), radial-gradient(circle at 52% 12%, rgba(14, 165, 233, 0.25) 0%, transparent 30%)',
        }}
      />
      <div
        aria-hidden
        className="research-tools-quantum-grid-drift pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(125, 211, 252, 0.55) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div
        aria-hidden
        className="research-tools-quantum-grid-drift pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(165, 180, 252, 0.7) 1.5px, transparent 1.5px)',
          backgroundSize: '56px 56px',
          backgroundPosition: '14px 18px',
          animationDuration: '32s',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(56, 189, 248, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full text-sky-400/25"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
      >
        <circle
          ref={outerRingRef}
          cx="400"
          cy="300"
          r="180"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        <ellipse
          ref={ellipseRingRef}
          cx="400"
          cy="300"
          rx="220"
          ry="90"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.75"
          transform="rotate(-24 400 300)"
        />
        <circle
          ref={midRingRef}
          cx="400"
          cy="300"
          r="120"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.75"
        />
        <circle cx="400" cy="300" r="60" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <circle
          cx="140"
          cy="120"
          r="3"
          fill="currentColor"
          className="research-tools-quantum-particle-twinkle text-cyan-300/60"
        />
        <circle
          cx="680"
          cy="160"
          r="2.5"
          fill="currentColor"
          className="research-tools-quantum-particle-twinkle-delayed text-indigo-300/50"
        />
        <circle
          cx="620"
          cy="480"
          r="3.5"
          fill="currentColor"
          className="research-tools-quantum-particle-twinkle text-sky-300/55"
          style={{ animationDelay: '-2.1s' }}
        />
        <circle
          cx="180"
          cy="440"
          r="2"
          fill="currentColor"
          className="research-tools-quantum-particle-twinkle-delayed text-blue-300/45"
          style={{ animationDelay: '-0.8s' }}
        />
      </svg>
      <div
        aria-hidden
        className="research-tools-quantum-glow-pulse pointer-events-none absolute -left-24 top-1/4 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl"
      />
      <div
        aria-hidden
        className="research-tools-quantum-glow-pulse-delayed pointer-events-none absolute -right-16 bottom-1/4 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl"
      />
    </>
  );
}

export function ResearchTools() {
  const { t } = useTranslation('common');

  const handleOpenQuafu = () => {
    void hostApi.shell.openExternal(QUA_FU_SQC_HOME);
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

        <div
          data-testid="research-tools-hero-card"
          className={cn(
            'relative flex flex-1 min-h-0 items-center justify-center overflow-hidden rounded-3xl',
            'border border-sky-500/20',
            'shadow-[0_24px_80px_-24px_rgba(14,165,233,0.35)]',
            'dark:shadow-[0_28px_90px_-28px_rgba(56,189,248,0.25)]',
          )}
        >
          <QuantumHeroDecor />

          <div className="research-tools-quantum-btn-wrap relative z-10 px-6">
            <div
              aria-hidden
              className="research-tools-quantum-btn-halo pointer-events-none absolute -inset-6 rounded-full blur-2xl"
            />
            <div
              className={cn(
                'research-tools-quantum-btn-shell relative rounded-full p-[2px]',
                'bg-gradient-to-r from-sky-300 via-sky-500 to-blue-600',
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
                  'ring-1 ring-inset ring-white/25',
                  'shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-8px_16px_rgba(0,0,0,0.1)]',
                  'transition-all duration-200',
                  'hover:brightness-110',
                  'active:scale-[0.98]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
                )}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-8 top-1.5 h-[38%] rounded-full bg-gradient-to-b from-white/10 to-transparent"
                />
                {t('researchToolsPage.quafuLoginButton')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
