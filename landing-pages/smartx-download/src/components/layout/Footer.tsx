import { Picture } from '../ui/Picture';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200/80 bg-white/50 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
        <p className="text-xs font-medium text-ink-faint">
          © {year} 北京中科国光量子科技有限公司 · 小光 · MIT License
        </p>
        <p className="inline-flex items-center gap-2 text-xs font-medium text-ink-faint">
          <span>设计与开发</span>
          <span aria-hidden="true">·</span>
          <a
            href="https://ai-squad.qubitlab.cc/"
            className="inline-flex items-center gap-1.5 text-ink-muted transition-colors hover:text-brand-blue"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Picture
              src="./images/ai-research-logo.png"
              alt=""
              width={20}
              height={20}
              className="h-5 w-5 shrink-0 rounded-md object-contain"
            />
            <span>AI研究小组</span>
          </a>
        </p>
      </div>
    </footer>
  );
}
