import type { LucideIcon } from 'lucide-react';
import { Rocket } from 'lucide-react';

interface ComingSoonPlatformCardProps {
  label: string;
  Icon: LucideIcon;
  accent?: 'ios' | 'android' | 'harmony';
}

const accentStyles = {
  ios: {
    iconBg: 'from-slate-100 to-brand-sky/15',
    iconRing: 'ring-brand-sky/25',
    iconColor: 'text-brand-blue',
    glow: 'bg-brand-sky/20',
    badge: 'from-brand-blue/90 to-brand-sky',
  },
  android: {
    iconBg: 'from-emerald-50 to-brand-sky/10',
    iconRing: 'ring-emerald-200/60',
    iconColor: 'text-emerald-600',
    glow: 'bg-emerald-400/15',
    badge: 'from-emerald-500 to-brand-sky',
  },
  harmony: {
    iconBg: 'from-red-50 to-orange-50',
    iconRing: 'ring-red-200/55',
    iconColor: 'text-red-600',
    glow: 'bg-red-400/15',
    badge: 'from-red-500 to-orange-400',
  },
} as const;

export function ComingSoonPlatformCard({ label, Icon, accent = 'ios' }: ComingSoonPlatformCardProps) {
  const styles = accentStyles[accent];

  return (
    <article
      className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur-xl transition-shadow hover:shadow-glow sm:p-7"
      role="status"
      aria-label={`${label} 即将推出`}
    >
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl ${styles.glow}`}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-8 left-1/4 h-28 w-28 rounded-full bg-brand-violet/10 blur-2xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
        <div
          className={`mx-auto flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-inner ring-1 sm:mx-0 ${styles.iconBg} ${styles.iconRing}`}
        >
          <Icon className={`h-8 w-8 ${styles.iconColor}`} strokeWidth={1.75} aria-hidden />
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">{label}</p>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r px-3 py-1 text-xs font-semibold text-white shadow-sm ${styles.badge}`}
            >
              <Rocket className="h-3 w-3" aria-hidden />
              即将推出
            </span>
          </div>

          <p className="mt-3 font-display text-lg font-semibold leading-snug text-ink sm:text-xl">
            应用正在
            <span className="text-gradient-brand">飞速开发</span>
            中
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">敬请期待，上线后将第一时间在此提供下载</p>
        </div>
      </div>

      <div
        className="relative mt-6 flex items-center justify-center gap-1.5 sm:justify-start"
        aria-hidden
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 rounded-full bg-gradient-to-r from-brand-sky/40 to-brand-violet/40"
            style={{ width: `${0.5 + i * 0.35}rem`, opacity: 0.35 + i * 0.25 }}
          />
        ))}
      </div>
    </article>
  );
}
