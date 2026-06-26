import type { MouseEvent } from 'react';
import { Download, Zap } from 'lucide-react';
import type { DownloadVariant } from '../../types/downloads';
import { ArchBadge } from './ArchBadge';

interface DownloadCardProps {
  platformLabel: string;
  variant: DownloadVariant;
  highlighted: boolean;
  version: string;
  assetBaseUrl: string;
  ossBaseUrl?: string;
}

function resolveDownloadHref(baseUrl: string, path: string): string {
  if (path === '#') return path;
  const base = baseUrl.replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function DownloadCard({
  platformLabel,
  variant,
  highlighted,
  version,
  assetBaseUrl,
  ossBaseUrl,
}: DownloadCardProps) {
  const href = resolveDownloadHref(assetBaseUrl, variant.path);
  const ossHref =
    ossBaseUrl && variant.path !== '#' ? resolveDownloadHref(ossBaseUrl, variant.path) : null;
  const ariaLabel = `下载 ${platformLabel} ${variant.label} ${variant.format}（${variant.arch}）`;
  const ossAriaLabel = `${ariaLabel}（高速下载）`;

  return (
    <article
      className={`group relative flex flex-col rounded-3xl border p-5 transition-all ${
        highlighted
          ? 'border-brand-sky/50 bg-white shadow-glow ring-2 ring-brand-sky/30'
          : 'glass-card hover:border-brand-blue/20 hover:shadow-soft'
      }`}
    >
      {highlighted ? (
        <span className="absolute -top-2.5 left-5 rounded-full bg-gradient-to-r from-brand-sky to-brand-violet px-3 py-0.5 text-xs font-semibold text-white">
          推荐
        </span>
      ) : null}

      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{platformLabel}</p>
          <h3 className="mt-1 font-display text-lg font-semibold text-ink">{variant.label}</h3>
        </div>
        <span className="rounded-xl bg-surface-muted px-2.5 py-1 text-xs font-semibold text-ink-muted">
          {variant.format}
        </span>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <ArchBadge arch={variant.arch} />
        {variant.size ? (
          <span className="text-sm text-ink-muted">{variant.size}</span>
        ) : null}
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <a
          href={href}
          aria-label={ariaLabel}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${
            highlighted
              ? 'bg-gradient-to-r from-brand-blue to-brand-sky text-white hover:scale-[1.02]'
              : 'bg-ink text-white hover:bg-ink/90'
          }`}
          {...(href === '#' ? { onClick: (e: MouseEvent) => e.preventDefault() } : {})}
        >
          <Download className="h-4 w-4" aria-hidden />
          下载 v{version}
        </a>
        {ossHref ? (
          <a
            href={ossHref}
            aria-label={ossAriaLabel}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-orange-200/80 bg-orange-50/90 px-4 py-2.5 text-sm font-semibold text-orange-800/90 transition-colors hover:border-orange-300 hover:bg-orange-100/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400/60"
          >
            <Zap className="h-4 w-4 text-orange-600/80" aria-hidden />
            高速下载
          </a>
        ) : null}
      </div>
    </article>
  );
}
