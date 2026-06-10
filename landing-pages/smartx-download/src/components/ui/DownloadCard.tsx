import type { MouseEvent } from 'react';
import { Download } from 'lucide-react';
import type { DownloadVariant } from '../../types/downloads';

interface DownloadCardProps {
  platformLabel: string;
  variant: DownloadVariant;
  highlighted: boolean;
  version: string;
  assetBaseUrl: string;
}

function resolveDownloadHref(assetBaseUrl: string, path: string): string {
  if (path === '#') return path;
  const base = assetBaseUrl.replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function DownloadCard({
  platformLabel,
  variant,
  highlighted,
  version,
  assetBaseUrl,
}: DownloadCardProps) {
  const href = resolveDownloadHref(assetBaseUrl, variant.path);
  const ariaLabel = `下载 ${platformLabel} ${variant.label} ${variant.format}（${variant.arch}）`;

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

      <p className="mb-5 text-sm text-ink-muted">
        架构 <span className="font-medium text-ink">{variant.arch}</span>
        {variant.size ? (
          <>
            {' '}
            · {variant.size}
          </>
        ) : null}
      </p>

      <a
        href={href}
        aria-label={ariaLabel}
        className={`mt-auto inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${
          highlighted
            ? 'bg-gradient-to-r from-brand-blue to-brand-sky text-white hover:scale-[1.02]'
            : 'bg-ink text-white hover:bg-ink/90'
        }`}
        {...(href === '#' ? { onClick: (e: MouseEvent) => e.preventDefault() } : {})}
      >
        <Download className="h-4 w-4" aria-hidden />
        下载 v{version}
      </a>
    </article>
  );
}
